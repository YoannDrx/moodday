import {
  createCipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";
import { buildRegulatoryDataExport } from "@/features/account/regulatory-data-export";
import {
  createRegulatoryExportDownloadCredential,
  deletePrivateRegulatoryExport,
  publishPrivateRegulatoryExport,
  REGULATORY_EXPORT_RETENTION_MS,
} from "@/features/account/regulatory-export-delivery";
import { prisma } from "@/lib/prisma";

const REQUIRED_ACK = "identity-and-scope-approved";
const ARTIFACT_DIRECTORY = path.resolve(process.cwd(), "artifacts/dsar");

function readArgument(name: string) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`Missing ${name}`);
  return value;
}

function getEncryptionKey() {
  const encoded = process.env.DSAR_EXPORT_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Missing DSAR_EXPORT_ENCRYPTION_KEY");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("DSAR_EXPORT_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
}

function reference(scope: string, value: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Invalid auth secret");
  return createHmac("sha256", secret)
    .update(`moodday-dsar-${scope}:${value}`)
    .digest("base64url")
    .slice(0, 43);
}

function encryptExport(value: unknown, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return {
    envelopeVersion: 1,
    algorithm: "AES-256-GCM",
    iv: iv.toString("base64"),
    authenticationTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function getDownloadBaseUrl() {
  const raw = process.env.DSAR_DOWNLOAD_BASE_URL ?? process.env.BETTER_AUTH_URL;
  if (!raw) throw new Error("Missing DSAR_DOWNLOAD_BASE_URL");
  const url = new URL(raw);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !local) {
    throw new Error("DSAR download base URL must use HTTPS");
  }
  return url;
}

async function main() {
  if (process.env.DSAR_EXPORT_ACK !== REQUIRED_ACK) {
    throw new Error(`DSAR_EXPORT_ACK must equal ${REQUIRED_ACK}`);
  }
  const userId = readArgument("--user-id");
  const requestId = readArgument("--request-id");
  const reviewerId = readArgument("--reviewer-id");
  const publishPrivate = process.argv.includes("--publish-private");
  const encryptionKey = getEncryptionKey();
  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (!authSecret) throw new Error("Missing BETTER_AUTH_SECRET");
  const requestReference = reference("request", requestId);
  const subjectReference = reference("subject", userId);
  const reviewerReference = reference("reviewer", reviewerId);
  const artifactPath = path.resolve(
    ARTIFACT_DIRECTORY,
    `${requestReference}.json.enc`,
  );
  if (!artifactPath.startsWith(`${ARTIFACT_DIRECTORY}${path.sep}`)) {
    throw new Error("Invalid artifact path");
  }
  const handoffPath = path.resolve(
    ARTIFACT_DIRECTORY,
    `${requestReference}.handoff.json`,
  );
  if (!handoffPath.startsWith(`${ARTIFACT_DIRECTORY}${path.sep}`)) {
    throw new Error("Invalid handoff path");
  }

  await prisma.regulatoryExportAudit.create({
    data: {
      requestReference,
      subjectReference,
      reviewerReference,
      approvedAt: new Date(),
      status: "pending",
    },
  });

  let publishedResourceLocator: string | undefined;
  try {
    const exportData = await buildRegulatoryDataExport(userId);
    const serialized = `${JSON.stringify(
      encryptExport(exportData, encryptionKey),
    )}\n`;
    const digest = createHash("sha256").update(serialized).digest("base64url");
    await mkdir(ARTIFACT_DIRECTORY, { recursive: true, mode: 0o700 });
    const generatedAt = new Date();
    const expiresAt = new Date(
      generatedAt.getTime() + REGULATORY_EXPORT_RETENTION_MS,
    );
    let downloadTokenDigest: string | undefined;
    let publishedAt: Date | undefined;

    if (publishPrivate) {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!blobToken) throw new Error("Missing BLOB_READ_WRITE_TOKEN");
      const credential = createRegulatoryExportDownloadCredential(
        authSecret,
        requestReference,
      );
      const blob = await publishPrivateRegulatoryExport({
        requestReference,
        encryptedBody: serialized,
        blobToken,
      });
      publishedResourceLocator = blob.pathname;
      downloadTokenDigest = credential.digest;
      publishedAt = new Date();
      const baseUrl = getDownloadBaseUrl();
      const downloadUrl = new URL(
        `/regulatory-export/${requestReference}`,
        baseUrl,
      );
      downloadUrl.hash = new URLSearchParams({
        token: credential.token,
      }).toString();
      const handoffFile = await open(handoffPath, "wx", 0o600);
      try {
        await handoffFile.writeFile(
          `${JSON.stringify({
            downloadUrl: downloadUrl.toString(),
            expiresAt: expiresAt.toISOString(),
          })}\n`,
          "utf8",
        );
      } finally {
        await handoffFile.close();
      }
    } else {
      const file = await open(artifactPath, "wx", 0o600);
      try {
        await file.writeFile(serialized, "utf8");
      } finally {
        await file.close();
      }
    }
    const auditUpdate = prisma.regulatoryExportAudit.update({
      where: { requestReference },
      data: {
        status: "generated",
        artifactDigest: digest,
        downloadTokenDigest,
        generatedAt,
        publishedAt,
        expiresAt,
      },
    });
    if (publishedResourceLocator) {
      await prisma.$transaction([
        prisma.externalDeletionJob.create({
          data: {
            subjectReference,
            resourceType: "vercel_blob_regulatory_export",
            resourceLocator: publishedResourceLocator,
            nextAttemptAt: expiresAt,
            retentionUntil: expiresAt,
          },
        }),
        auditUpdate,
      ]);
    } else {
      await auditUpdate;
    }
    process.stdout.write(
      `${JSON.stringify({
        eventName: "regulatory_export_generated",
        status: "generated",
        requestReference,
        artifactDigest: digest,
        expiresInHours: 24,
        privateDeliveryPrepared: publishPrivate,
      })}\n`,
    );
  } catch (error) {
    await Promise.all([
      rm(artifactPath, { force: true }),
      rm(handoffPath, { force: true }),
    ]).catch(() => undefined);
    if (publishedResourceLocator && process.env.BLOB_READ_WRITE_TOKEN) {
      await deletePrivateRegulatoryExport({
        resourceLocator: publishedResourceLocator,
        blobToken: process.env.BLOB_READ_WRITE_TOKEN,
      }).catch(() => undefined);
    }
    await prisma.regulatoryExportAudit.update({
      where: { requestReference },
      data: {
        status: "failed",
        lastErrorCode: error instanceof Error ? error.name : "unknown_error",
      },
    });
    throw error;
  }
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        eventName: "regulatory_export_failed",
        status: "failed",
        errorCode: error instanceof Error ? error.name : "unknown_error",
      })}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

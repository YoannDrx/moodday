import {
  getRegulatoryExportBlobPath,
  getRegulatoryExportTokenDigest,
  isRegulatoryExportRequestReference,
  readPrivateRegulatoryExport,
} from "@/features/account/regulatory-export-delivery";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const unavailable = (status = 410) =>
  Response.json(
    { code: status === 503 ? "temporarily_unavailable" : "link_unavailable" },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, noarchive",
      },
    },
  );

export async function POST(
  request: Request,
  context: { params: Promise<{ requestReference: string }> },
) {
  if (env.MAINTENANCE_MODE) return unavailable(503);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > 1024) {
    return unavailable();
  }
  const { requestReference } = await context.params;
  if (!isRegulatoryExportRequestReference(requestReference)) {
    return unavailable();
  }
  let token: string | undefined;
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : undefined;
  } catch {
    return unavailable();
  }
  if (!token || token.length < 32 || token.length > 256) return unavailable();
  if (!env.BLOB_READ_WRITE_TOKEN) return unavailable(503);

  let tokenDigest: string;
  try {
    tokenDigest = getRegulatoryExportTokenDigest(
      env.BETTER_AUTH_SECRET,
      requestReference,
      token,
    );
  } catch {
    return unavailable();
  }
  const now = new Date();
  const audit = await prisma.regulatoryExportAudit.findFirst({
    where: {
      requestReference,
      downloadTokenDigest: tokenDigest,
      status: "generated",
      publishedAt: { not: null },
      deliveredAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true, artifactDigest: true, expiresAt: true },
  });
  if (!audit?.expiresAt) return unavailable();

  let blob: Awaited<ReturnType<typeof readPrivateRegulatoryExport>>;
  try {
    blob = await readPrivateRegulatoryExport({
      requestReference,
      blobToken: env.BLOB_READ_WRITE_TOKEN,
    });
  } catch {
    return unavailable(503);
  }
  if (!blob || blob.statusCode !== 200) return unavailable();

  const resourceLocator = getRegulatoryExportBlobPath(requestReference);
  const deleteAfter = new Date(
    Math.min(audit.expiresAt.getTime(), now.getTime() + 15 * 60 * 1000),
  );
  let claimed = false;
  try {
    claimed = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.regulatoryExportAudit.updateMany({
        where: {
          id: audit.id,
          requestReference,
          downloadTokenDigest: tokenDigest,
          status: "generated",
          deliveredAt: null,
          expiresAt: { gt: now },
        },
        data: {
          status: "delivered",
          deliveredAt: now,
          downloadTokenDigest: null,
        },
      });
      if (updated.count !== 1) return false;
      const scheduled = await transaction.externalDeletionJob.updateMany({
        where: {
          resourceType: "vercel_blob_regulatory_export",
          resourceLocator,
          status: { in: ["pending", "retry"] },
        },
        data: { nextAttemptAt: deleteAfter },
      });
      if (scheduled.count !== 1) {
        throw new Error("Regulatory export deletion job is unavailable");
      }
      return true;
    });
  } catch {
    return unavailable(503);
  }
  if (!claimed) return unavailable();

  return new Response(blob.stream, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="moodday-regulatory-export-${requestReference.slice(0, 8)}.json.enc"`,
      "Content-Length": String(blob.blob.size),
      "Content-Type": "application/octet-stream",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Moodday-Artifact-Digest": audit.artifactDigest ?? "unavailable",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}

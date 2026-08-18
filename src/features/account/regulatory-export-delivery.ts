import { createHmac, randomBytes } from "node:crypto";
import { del, get, put } from "@vercel/blob";

export const REGULATORY_EXPORT_RETENTION_MS = 24 * 60 * 60 * 1000;
export const REGULATORY_EXPORT_MAX_BYTES = 100 * 1024 * 1024;
const REQUEST_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const isRegulatoryExportRequestReference = (value: string) =>
  REQUEST_REFERENCE_PATTERN.test(value);

export const getRegulatoryExportBlobPath = (requestReference: string) => {
  if (!isRegulatoryExportRequestReference(requestReference)) {
    throw new Error("Invalid regulatory export request reference");
  }
  return `regulatory-exports/${requestReference}.json.enc`;
};

export const getRegulatoryExportTokenDigest = (
  secret: string,
  requestReference: string,
  token: string,
) => {
  if (secret.length < 32) throw new Error("Invalid regulatory export secret");
  if (!isRegulatoryExportRequestReference(requestReference)) {
    throw new Error("Invalid regulatory export request reference");
  }
  if (token.length < 32) throw new Error("Invalid regulatory export token");
  return createHmac("sha256", secret)
    .update(`moodday-regulatory-export-download:${requestReference}:${token}`)
    .digest("base64url");
};

export const createRegulatoryExportDownloadCredential = (
  secret: string,
  requestReference: string,
) => {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    digest: getRegulatoryExportTokenDigest(secret, requestReference, token),
  };
};

export const publishPrivateRegulatoryExport = async (params: {
  requestReference: string;
  encryptedBody: string;
  blobToken: string;
}) => {
  const body = Buffer.from(params.encryptedBody, "utf8");
  if (body.byteLength > REGULATORY_EXPORT_MAX_BYTES) {
    throw new Error("Regulatory export exceeds the delivery size limit");
  }
  return put(getRegulatoryExportBlobPath(params.requestReference), body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 60,
    contentType: "application/octet-stream",
    maximumSizeInBytes: REGULATORY_EXPORT_MAX_BYTES,
    token: params.blobToken,
  });
};

export const readPrivateRegulatoryExport = async (params: {
  requestReference: string;
  blobToken: string;
}) =>
  get(getRegulatoryExportBlobPath(params.requestReference), {
    access: "private",
    useCache: false,
    token: params.blobToken,
  });

export const deletePrivateRegulatoryExport = async (params: {
  resourceLocator: string;
  blobToken: string;
}) => {
  const expectedPrefix = "regulatory-exports/";
  if (
    !params.resourceLocator.startsWith(expectedPrefix) ||
    !params.resourceLocator.endsWith(".json.enc") ||
    params.resourceLocator.includes("..")
  ) {
    throw new Error("Invalid regulatory export resource locator");
  }
  await del(params.resourceLocator, { token: params.blobToken });
};

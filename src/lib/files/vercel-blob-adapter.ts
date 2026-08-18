import { nanoid } from "nanoid";
import { del, put } from "@vercel/blob";

import { env } from "@/lib/env";
import type { UploadFileAdapter } from "./upload-file";

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

export const isManagedMooddayBlobUrl = (
  value?: string | null,
): value is string => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      (url.pathname.startsWith("/images/") ||
        url.pathname.startsWith("/profile-images/"))
    );
  } catch {
    return false;
  }
};

export const deleteManagedMooddayBlob = async (value?: string | null) => {
  if (!isManagedMooddayBlobUrl(value)) return false;
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob is not configured. The managed file cannot be deleted.",
    );
  }

  await del(value as string, { token: env.BLOB_READ_WRITE_TOKEN });
  return true;
};

export const vercelBlobAdapter: UploadFileAdapter = {
  uploadFile: async ({ file, path }) => {
    if (!env.BLOB_READ_WRITE_TOKEN) {
      return {
        error: new Error(
          "Vercel Blob is not configured. Set BLOB_READ_WRITE_TOKEN.",
        ),
        data: null,
      };
    }

    const safeName = sanitizeFilename(file.name || "upload");
    const blob = await put(`${path}/${nanoid(16)}-${safeName}`, file, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    return { error: null, data: { url: blob.url } };
  },
  uploadFiles: async (params) => {
    return Promise.all(
      params.map(async (param) => vercelBlobAdapter.uploadFile(param)),
    );
  },
};

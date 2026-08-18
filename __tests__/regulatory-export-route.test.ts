import { POST } from "@app/api/regulatory-export/[requestReference]/route";
import * as delivery from "@/features/account/regulatory-export-delivery";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  BETTER_AUTH_SECRET: `test-only-${"a".repeat(32)}`,
  BLOB_READ_WRITE_TOKEN: "blob-token" as string | undefined,
  MAINTENANCE_MODE: false,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv }));

const REFERENCE = "A".repeat(43);
const TOKEN = "B".repeat(43);

const request = (token: unknown = TOKEN, contentLength?: string) =>
  new Request(`https://moodday.app/api/regulatory-export/${REFERENCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    },
    body: JSON.stringify({ token }),
  });

const context = (requestReference = REFERENCE) => ({
  params: Promise.resolve({ requestReference }),
});

const rawRequest = (body: string, contentLength?: string) =>
  new Request(`https://moodday.app/api/regulatory-export/${REFERENCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    },
    body,
  });

const requestWithDeclaredLength = (contentLength: string) =>
  ({
    headers: new Headers({ "content-length": contentLength }),
    json: async () => ({ token: TOKEN }),
  }) as Request;

describe("regulatory export download route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedEnv.MAINTENANCE_MODE = false;
    mockedEnv.BETTER_AUTH_SECRET = `test-only-${"a".repeat(32)}`;
    mockedEnv.BLOB_READ_WRITE_TOKEN = "blob-token";
    vi.mocked(prisma.regulatoryExportAudit.findFirst).mockResolvedValue({
      id: "audit-1",
      artifactDigest: "artifact-digest",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    } as never);
    vi.mocked(prisma.regulatoryExportAudit.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.externalDeletionJob.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prisma) : Promise.all(callback),
    );
    vi.spyOn(delivery, "readPrivateRegulatoryExport").mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("encrypted-body"));
          controller.close();
        },
      }),
      headers: new Headers(),
      blob: {
        size: 14,
        contentType: "application/octet-stream",
        url: "private",
        downloadUrl: "private",
        pathname: `regulatory-exports/${REFERENCE}.json.enc`,
        contentDisposition: "attachment",
        cacheControl: "private",
        uploadedAt: new Date(),
        etag: "etag",
      },
    });
  });

  it("streams a valid export once and schedules its prompt deletion", async () => {
    const response = await POST(request(), context());

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("encrypted-body");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-type")).toBe(
      "application/octet-stream",
    );
    expect(response.headers.get("x-moodday-artifact-digest")).toBe(
      "artifact-digest",
    );
    expect(prisma.regulatoryExportAudit.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "delivered",
          downloadTokenDigest: null,
        }),
      }),
    );
    expect(prisma.externalDeletionJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          resourceType: "vercel_blob_regulatory_export",
        }),
      }),
    );
  });

  it("rejects malformed, oversized and expired links without reading Blob", async () => {
    const blobRead = vi.mocked(delivery.readPrivateRegulatoryExport);
    expect((await POST(request(TOKEN), context("unsafe"))).status).toBe(410);
    expect((await POST(request("C".repeat(2048)), context())).status).toBe(410);
    vi.mocked(prisma.regulatoryExportAudit.findFirst).mockResolvedValue(null);
    expect((await POST(request(), context())).status).toBe(410);
    expect(blobRead).not.toHaveBeenCalled();
  });

  it("fails closed when a concurrent request already consumed the token", async () => {
    vi.mocked(prisma.regulatoryExportAudit.updateMany).mockResolvedValue({
      count: 0,
    });

    const response = await POST(request(), context());

    expect(response.status).toBe(410);
    expect(prisma.externalDeletionJob.updateMany).not.toHaveBeenCalled();
  });

  it("returns a generic degraded state if deletion cannot be guaranteed", async () => {
    vi.mocked(prisma.externalDeletionJob.updateMany).mockResolvedValue({
      count: 0,
    });

    const response = await POST(request(), context());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "temporarily_unavailable",
    });
  });

  it("blocks delivery while maintenance mode is active", async () => {
    mockedEnv.MAINTENANCE_MODE = true;

    const response = await POST(request(), context());

    expect(response.status).toBe(503);
    expect(prisma.regulatoryExportAudit.findFirst).not.toHaveBeenCalled();
  });

  it.each(["NaN", "1025"])(
    "rejects an invalid content length: %s",
    async (contentLength) => {
      const response = await POST(
        requestWithDeclaredLength(contentLength),
        context(),
      );
      expect(response.status).toBe(410);
      expect(prisma.regulatoryExportAudit.findFirst).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON and non-string tokens", async () => {
    expect((await POST(rawRequest("{"), context())).status).toBe(410);
    expect((await POST(request({ token: TOKEN }), context())).status).toBe(410);
    expect(prisma.regulatoryExportAudit.findFirst).not.toHaveBeenCalled();
  });

  it.each([null, "short", "C".repeat(257)])(
    "rejects an unusable token: %s",
    async (token) => {
      expect((await POST(request(token), context())).status).toBe(410);
      expect(prisma.regulatoryExportAudit.findFirst).not.toHaveBeenCalled();
    },
  );

  it("returns a degraded state when Blob or the HMAC secret is unavailable", async () => {
    mockedEnv.BLOB_READ_WRITE_TOKEN = undefined;
    expect((await POST(request(), context())).status).toBe(503);
    mockedEnv.BLOB_READ_WRITE_TOKEN = "blob-token";
    mockedEnv.BETTER_AUTH_SECRET = "short";
    expect((await POST(request(), context())).status).toBe(410);
    expect(prisma.regulatoryExportAudit.findFirst).not.toHaveBeenCalled();
  });

  it("fails closed when Blob throws, misses, or returns a non-success status", async () => {
    const blobRead = vi.mocked(delivery.readPrivateRegulatoryExport);
    blobRead.mockRejectedValueOnce(new Error("provider unavailable"));
    expect((await POST(request(), context())).status).toBe(503);
    blobRead.mockResolvedValueOnce(null);
    expect((await POST(request(), context())).status).toBe(410);
    blobRead.mockResolvedValueOnce({ statusCode: 404 } as never);
    expect((await POST(request(), context())).status).toBe(410);
  });

  it("uses the generic digest label and the export expiry when it is sooner", async () => {
    vi.mocked(prisma.regulatoryExportAudit.findFirst).mockResolvedValue({
      id: "audit-1",
      artifactDigest: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    const response = await POST(request(), context());

    expect(response.status).toBe(200);
    expect(response.headers.get("x-moodday-artifact-digest")).toBe(
      "unavailable",
    );
    expect(prisma.externalDeletionJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { nextAttemptAt: expect.any(Date) },
      }),
    );
  });
});

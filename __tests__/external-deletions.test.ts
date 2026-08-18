import { deletePrivateRegulatoryExport } from "@/features/account/regulatory-export-delivery";
import { deleteManagedMooddayBlob } from "@/lib/files/vercel-blob-adapter";
import { processExternalDeletionJobs } from "@/lib/operations/external-deletions";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/account/regulatory-export-delivery", () => ({
  deletePrivateRegulatoryExport: vi.fn(),
}));
vi.mock("@/lib/files/vercel-blob-adapter", () => ({
  deleteManagedMooddayBlob: vi.fn(),
}));
const state = vi.hoisted(() => ({
  blobToken: "blob-token" as string | undefined,
}));
vi.mock("@/lib/env", () => ({
  env: {
    get BLOB_READ_WRITE_TOKEN() {
      return state.blobToken;
    },
  },
}));

describe("external deletion jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.blobToken = "blob-token";
    vi.mocked(deletePrivateRegulatoryExport).mockReset();
    vi.mocked(prisma.externalDeletionJob.findMany).mockResolvedValue([
      {
        id: "job-1",
        resourceType: "vercel_blob_regulatory_export",
        resourceLocator: "regulatory-exports/request.json.enc",
        attempts: 0,
      },
    ] as never);
    vi.mocked(prisma.externalDeletionJob.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.externalDeletionJob.update).mockResolvedValue({} as never);
  });

  it("deletes private regulatory exports without accepting public paths", async () => {
    const now = new Date("2026-08-13T12:00:00.000Z");

    await expect(processExternalDeletionJobs(now)).resolves.toEqual({
      claimed: 1,
      succeeded: 1,
      retried: 0,
      dead: 0,
    });
    expect(deletePrivateRegulatoryExport).toHaveBeenCalledWith({
      resourceLocator: "regulatory-exports/request.json.enc",
      blobToken: "blob-token",
    });
    expect(prisma.externalDeletionJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        }),
      }),
    );
    expect(prisma.externalDeletionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "succeeded" }),
      }),
    );
  });

  it("retries provider failures with a bounded next attempt", async () => {
    vi.mocked(deletePrivateRegulatoryExport).mockRejectedValue(
      new Error("provider unavailable"),
    );

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 0,
      retried: 1,
      dead: 0,
    });
    expect(prisma.externalDeletionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "retry",
          nextAttemptAt: expect.any(Date),
          lastErrorCode: "Error",
        }),
      }),
    );
  });

  it("deletes managed profile images", async () => {
    vi.mocked(prisma.externalDeletionJob.findMany).mockResolvedValue([
      {
        id: "job-image",
        resourceType: "vercel_blob_profile_image",
        resourceLocator:
          "https://moodday.public.blob.vercel-storage.com/profile-images/avatar.png",
        attempts: 0,
      },
    ] as never);

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 1,
      retried: 0,
      dead: 0,
    });
    expect(deleteManagedMooddayBlob).toHaveBeenCalledTimes(1);
    expect(deletePrivateRegulatoryExport).not.toHaveBeenCalled();
  });

  it("ignores jobs claimed by a concurrent worker", async () => {
    vi.mocked(prisma.externalDeletionJob.updateMany).mockResolvedValue({
      count: 0,
    });

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 0,
      retried: 0,
      dead: 0,
    });
    expect(deletePrivateRegulatoryExport).not.toHaveBeenCalled();
    expect(prisma.externalDeletionJob.update).not.toHaveBeenCalled();
  });

  it("retries a regulatory export when Blob is not configured", async () => {
    state.blobToken = undefined;

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 0,
      retried: 1,
      dead: 0,
    });
    expect(deletePrivateRegulatoryExport).not.toHaveBeenCalled();
  });

  it("rejects unsupported resource types without invoking a provider", async () => {
    vi.mocked(prisma.externalDeletionJob.findMany).mockResolvedValue([
      {
        id: "job-unsupported",
        resourceType: "unknown_resource",
        resourceLocator: "opaque-locator",
        attempts: 0,
      },
    ] as never);

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 0,
      retried: 1,
      dead: 0,
    });
    expect(deleteManagedMooddayBlob).not.toHaveBeenCalled();
    expect(deletePrivateRegulatoryExport).not.toHaveBeenCalled();
  });

  it("dead-letters the sixth failed attempt", async () => {
    vi.mocked(prisma.externalDeletionJob.findMany).mockResolvedValue([
      {
        id: "job-dead",
        resourceType: "vercel_blob_regulatory_export",
        resourceLocator: "regulatory-exports/request.json.enc",
        attempts: 5,
      },
    ] as never);
    vi.mocked(deletePrivateRegulatoryExport).mockRejectedValue(
      new Error("provider unavailable"),
    );

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 0,
      retried: 0,
      dead: 1,
    });
    expect(prisma.externalDeletionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "dead",
          nextAttemptAt: null,
        }),
      }),
    );
  });

  it("caps retry backoff and handles non-Error failures safely", async () => {
    vi.mocked(prisma.externalDeletionJob.findMany).mockResolvedValue([
      {
        id: "job-backoff",
        resourceType: "vercel_blob_regulatory_export",
        resourceLocator: "regulatory-exports/request.json.enc",
        attempts: 4,
      },
    ] as never);
    vi.mocked(deletePrivateRegulatoryExport).mockRejectedValue("failure");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T14:00:00.000Z"));

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 1,
      succeeded: 0,
      retried: 1,
      dead: 0,
    });
    expect(prisma.externalDeletionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "retry",
          nextAttemptAt: new Date("2026-08-18T15:00:00.000Z"),
          lastErrorCode: "unknown_error",
        }),
      }),
    );

    vi.useRealTimers();
  });

  it("returns zero work when no deletion is due", async () => {
    vi.mocked(prisma.externalDeletionJob.findMany).mockResolvedValue([]);

    await expect(processExternalDeletionJobs()).resolves.toEqual({
      claimed: 0,
      succeeded: 0,
      retried: 0,
      dead: 0,
    });
  });
});

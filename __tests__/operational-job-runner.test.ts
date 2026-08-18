import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runOperationalJob } from "@/lib/operations/job-runner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const NOW = new Date("2026-08-13T12:00:00.000Z");
const INTERVAL_MS = 5 * 60 * 1000;
const EXECUTION_KEY = `notifications:${Math.floor(NOW.getTime() / INTERVAL_MS)}`;

describe("runOperationalJob", () => {
  beforeEach(() => {
    vi.mocked(prisma.operationalJobRun.create).mockReset();
    vi.mocked(prisma.operationalJobRun.findFirst).mockReset();
    vi.mocked(prisma.operationalJobRun.updateMany).mockReset();
    vi.mocked(prisma.operationalJobRun.findUnique).mockReset();
    vi.mocked(prisma.operationalJobRun.update).mockReset();
    vi.mocked(prisma.operationalHeartbeat.upsert).mockReset();
    vi.mocked(prisma.operationalHeartbeat.update).mockReset();
    vi.mocked(prisma.$executeRaw).mockReset();
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.operationalJobRun.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.operationalJobRun.create).mockResolvedValue({} as never);
    vi.mocked(prisma.operationalJobRun.update).mockResolvedValue({} as never);
    vi.mocked(prisma.operationalHeartbeat.upsert).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.operationalHeartbeat.update).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (operations) =>
      Array.isArray(operations) ? Promise.all(operations) : operations(prisma),
    );
  });

  it("claims, heartbeats and completes one idempotent execution", async () => {
    const task = vi.fn(async () => ({ sent: 3 }));

    const result = await runOperationalJob({
      jobName: "notifications",
      intervalMs: INTERVAL_MS,
      now: NOW,
      task,
    });

    expect(result).toEqual({ skipped: false, result: { sent: 3 } });
    expect(prisma.operationalJobRun.create).toHaveBeenCalledWith({
      data: {
        jobName: "notifications",
        executionKey: EXECUTION_KEY,
        status: "processing",
        attempts: 1,
        startedAt: NOW,
      },
    });
    expect(prisma.operationalHeartbeat.upsert).toHaveBeenCalledWith({
      where: { serviceName: "notifications" },
      create: { serviceName: "notifications", lastStartedAt: NOW },
      update: { lastStartedAt: NOW },
    });
    expect(prisma.operationalJobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { executionKey: EXECUTION_KEY },
        data: expect.objectContaining({ status: "succeeded" }),
      }),
    );
  });

  it("skips an execution that is already owned by another worker", async () => {
    vi.mocked(prisma.operationalJobRun.findFirst).mockResolvedValueOnce({
      id: "active-run",
    } as never);

    const task = vi.fn(async () => "never");
    await expect(
      runOperationalJob({
        jobName: "notifications",
        intervalMs: INTERVAL_MS,
        now: NOW,
        task,
      }),
    ).resolves.toEqual({ skipped: true, reason: "already_claimed" });
    expect(task).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
    expect(prisma.operationalHeartbeat.upsert).not.toHaveBeenCalled();
  });

  it("reclaims the oldest due retry from a previous bucket atomically", async () => {
    const priorExecutionKey = "notifications:previous-bucket";
    vi.mocked(prisma.operationalJobRun.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "retry-run",
        executionKey: priorExecutionKey,
      } as never);
    vi.mocked(prisma.operationalJobRun.updateMany).mockResolvedValue({
      count: 1,
    });

    const result = await runOperationalJob({
      jobName: "notifications",
      intervalMs: INTERVAL_MS,
      now: NOW,
      task: async () => "recovered",
    });

    expect(result).toEqual({ skipped: false, result: "recovered" });
    expect(prisma.operationalJobRun.updateMany).toHaveBeenCalledWith({
      where: {
        id: "retry-run",
        attempts: { lt: 6 },
        OR: [
          { status: "retry", nextAttemptAt: { lte: NOW } },
          {
            status: "processing",
            startedAt: { lt: new Date("2026-08-13T11:50:00.000Z") },
          },
        ],
      },
      data: expect.objectContaining({
        status: "processing",
        attempts: { increment: 1 },
      }),
    });
    expect(prisma.operationalJobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { executionKey: priorExecutionKey } }),
    );
  });

  it("treats a duplicate current bucket as already claimed", async () => {
    vi.mocked(prisma.operationalJobRun.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      runOperationalJob({
        jobName: "notifications",
        intervalMs: INTERVAL_MS,
        now: NOW,
        task: async () => "never",
      }),
    ).resolves.toEqual({ skipped: true, reason: "already_claimed" });
  });

  it("does not hide a database error while claiming", async () => {
    vi.mocked(prisma.operationalJobRun.create).mockRejectedValue(
      new Error("database unavailable"),
    );

    await expect(
      runOperationalJob({
        jobName: "notifications",
        intervalMs: INTERVAL_MS,
        now: NOW,
        task: async () => undefined,
      }),
    ).rejects.toThrow("database unavailable");
  });

  it("schedules a bounded retry and increments the failure heartbeat", async () => {
    vi.mocked(prisma.operationalJobRun.findUnique).mockResolvedValue({
      attempts: 2,
    } as never);
    const failure = new TypeError("provider unavailable");

    await expect(
      runOperationalJob({
        jobName: "notifications",
        intervalMs: INTERVAL_MS,
        now: NOW,
        task: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);

    expect(prisma.operationalJobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { executionKey: EXECUTION_KEY },
        data: expect.objectContaining({
          status: "retry",
          nextAttemptAt: expect.any(Date),
          lastErrorCode: "TypeError",
        }),
      }),
    );
    expect(prisma.operationalHeartbeat.update).toHaveBeenCalledWith({
      where: { serviceName: "notifications" },
      data: expect.objectContaining({
        lastErrorCode: "TypeError",
        consecutiveFailures: { increment: 1 },
      }),
    });
  });

  it.each([
    { current: { attempts: 6 }, rejection: new Error("exhausted") },
    { current: null, rejection: "non-error" },
  ])("dead-letters an exhausted failure", async ({ current, rejection }) => {
    vi.mocked(prisma.operationalJobRun.findUnique).mockResolvedValue(
      current as never,
    );

    await expect(
      runOperationalJob({
        jobName: "notifications",
        intervalMs: INTERVAL_MS,
        now: NOW,
        task: async () => Promise.reject(rejection),
      }),
    ).rejects.toBe(rejection);

    expect(prisma.operationalJobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "dead",
          nextAttemptAt: null,
          lastErrorCode: rejection instanceof Error ? "Error" : "unknown_error",
        }),
      }),
    );
  });
});

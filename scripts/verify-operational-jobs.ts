/* eslint-disable no-console -- standalone verification script emits one result */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { runOperationalJob } from "@/lib/operations/job-runner";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const hostname = new URL(databaseUrl).hostname;
if (hostname !== "localhost" && hostname !== "127.0.0.1") {
  throw new Error("Operational job verification requires a local database");
}

const suffix = randomUUID();
const concurrentJobName = `job-concurrency-proof-${suffix}`;
const retryJobName = `job-retry-proof-${suffix}`;
const intervalMs = 5 * 60 * 1000;

const main = async () => {
  let taskCalls = 0;
  let releaseTask: (() => void) | undefined;
  let signalTaskStarted: (() => void) | undefined;
  const taskRelease = new Promise<void>((resolve) => {
    releaseTask = resolve;
  });
  const taskStarted = new Promise<void>((resolve) => {
    signalTaskStarted = resolve;
  });

  try {
    const now = new Date();
    const firstWorker = runOperationalJob({
      jobName: concurrentJobName,
      intervalMs,
      now,
      task: async () => {
        taskCalls += 1;
        signalTaskStarted?.();
        await taskRelease;
        return "first-worker";
      },
    });

    await taskStarted;
    const secondWorker = await runOperationalJob({
      jobName: concurrentJobName,
      intervalMs,
      now,
      task: async () => {
        taskCalls += 1;
        return "second-worker";
      },
    });
    assert.deepEqual(secondWorker, {
      skipped: true,
      reason: "already_claimed",
    });
    releaseTask?.();
    assert.deepEqual(await firstWorker, {
      skipped: false,
      result: "first-worker",
    });
    assert.equal(taskCalls, 1);

    const retryExecutionKey = `${retryJobName}:previous-window`;
    await prisma.operationalJobRun.create({
      data: {
        jobName: retryJobName,
        executionKey: retryExecutionKey,
        status: "retry",
        attempts: 1,
        startedAt: new Date(now.getTime() - intervalMs),
        finishedAt: new Date(now.getTime() - intervalMs),
        nextAttemptAt: new Date(now.getTime() - 1),
        lastErrorCode: "synthetic_failure",
      },
    });
    const retryResult = await runOperationalJob({
      jobName: retryJobName,
      intervalMs,
      now,
      task: async () => "retried",
    });
    assert.deepEqual(retryResult, { skipped: false, result: "retried" });
    const retriedRun = await prisma.operationalJobRun.findUniqueOrThrow({
      where: { executionKey: retryExecutionKey },
    });
    assert.equal(retriedRun.status, "succeeded");
    assert.equal(retriedRun.attempts, 2);
    assert.equal(
      await prisma.operationalJobRun.count({
        where: { jobName: retryJobName },
      }),
      1,
    );

    console.log(
      JSON.stringify({
        ok: true,
        concurrentWorkerSkipped: true,
        exactlyOnceTaskExecution: true,
        previousWindowRetryReclaimed: true,
      }),
    );
  } finally {
    releaseTask?.();
    await prisma.operationalJobRun.deleteMany({
      where: { jobName: { in: [concurrentJobName, retryJobName] } },
    });
    await prisma.operationalHeartbeat.deleteMany({
      where: { serviceName: { in: [concurrentJobName, retryJobName] } },
    });
    await prisma.$disconnect();
  }
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verification failed");
  process.exitCode = 1;
});

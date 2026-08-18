import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const isUniqueExecution = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

const MAX_JOB_ATTEMPTS = 6;
const STALE_PROCESSING_MS = 10 * 60 * 1000;

export const runOperationalJob = async <T>(params: {
  jobName: string;
  intervalMs: number;
  task: () => Promise<T>;
  now?: Date;
}) => {
  const now = params.now ?? new Date();
  const bucket = Math.floor(now.getTime() / params.intervalMs);
  const executionKey = `${params.jobName}:${bucket}`;

  const claimedExecutionKey = await prisma.$transaction(async (transaction) => {
    // The transaction-scoped advisory lock serializes claims for this job.
    // The task itself runs outside the transaction; its processing row is the
    // durable lease observed by the next claimant.
    await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${`operational-job:${params.jobName}`}, 0))
      `;

    const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);
    const active = await transaction.operationalJobRun.findFirst({
      where: {
        jobName: params.jobName,
        status: "processing",
        startedAt: { gte: staleBefore },
      },
      select: { id: true },
    });
    if (active) return null;

    const retryable = await transaction.operationalJobRun.findFirst({
      where: {
        jobName: params.jobName,
        attempts: { lt: MAX_JOB_ATTEMPTS },
        OR: [
          { status: "retry", nextAttemptAt: { lte: now } },
          { status: "processing", startedAt: { lt: staleBefore } },
        ],
      },
      select: { id: true, executionKey: true },
      orderBy: { createdAt: "asc" },
    });
    if (retryable) {
      const retry = await transaction.operationalJobRun.updateMany({
        where: {
          id: retryable.id,
          attempts: { lt: MAX_JOB_ATTEMPTS },
          OR: [
            { status: "retry", nextAttemptAt: { lte: now } },
            { status: "processing", startedAt: { lt: staleBefore } },
          ],
        },
        data: {
          status: "processing",
          attempts: { increment: 1 },
          startedAt: now,
          finishedAt: null,
          nextAttemptAt: null,
          lastErrorCode: null,
        },
      });
      if (retry.count === 1) return retryable.executionKey;
    }

    try {
      await transaction.operationalJobRun.create({
        data: {
          jobName: params.jobName,
          executionKey,
          status: "processing",
          attempts: 1,
          startedAt: now,
        },
      });
      return executionKey;
    } catch (error) {
      if (isUniqueExecution(error)) return null;
      throw error;
    }
  });

  if (!claimedExecutionKey) {
    return { skipped: true as const, reason: "already_claimed" as const };
  }

  await prisma.operationalHeartbeat.upsert({
    where: { serviceName: params.jobName },
    create: { serviceName: params.jobName, lastStartedAt: now },
    update: { lastStartedAt: now },
  });

  try {
    const result = await params.task();
    const finishedAt = new Date();
    await prisma.$transaction([
      prisma.operationalJobRun.update({
        where: { executionKey: claimedExecutionKey },
        data: { status: "succeeded", finishedAt, lastErrorCode: null },
      }),
      prisma.operationalHeartbeat.update({
        where: { serviceName: params.jobName },
        data: {
          lastSuccessAt: finishedAt,
          lastErrorCode: null,
          consecutiveFailures: 0,
        },
      }),
    ]);
    return { skipped: false as const, result };
  } catch (error) {
    const finishedAt = new Date();
    const errorCode = error instanceof Error ? error.name : "unknown_error";
    const current = await prisma.operationalJobRun.findUnique({
      where: { executionKey: claimedExecutionKey },
      select: { attempts: true },
    });
    const attempts = current?.attempts ?? MAX_JOB_ATTEMPTS;
    const exhausted = attempts >= MAX_JOB_ATTEMPTS;
    await prisma.$transaction([
      prisma.operationalJobRun.update({
        where: { executionKey: claimedExecutionKey },
        data: {
          status: exhausted ? "dead" : "retry",
          finishedAt,
          nextAttemptAt: exhausted
            ? null
            : new Date(
                finishedAt.getTime() +
                  Math.min(
                    params.intervalMs * 2 ** Math.max(0, attempts - 1),
                    60 * 60_000,
                  ),
              ),
          lastErrorCode: errorCode,
        },
      }),
      prisma.operationalHeartbeat.update({
        where: { serviceName: params.jobName },
        data: {
          lastFailureAt: finishedAt,
          lastErrorCode: errorCode,
          consecutiveFailures: { increment: 1 },
        },
      }),
    ]);
    throw error;
  }
};

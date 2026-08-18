import "server-only";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type AiAdmissionResult =
  | { admitted: true; usageId: string }
  | {
      admitted: false;
      reason: "monthly_quota" | "daily_limit" | "temporarily_unavailable";
    };

export async function claimAiInsightUsage(params: {
  userId: string;
  requestKey: string;
  periodKey: string;
  monthlyUserLimit: number;
  model: string;
  promptVersion: string;
  now?: Date;
}): Promise<AiAdmissionResult> {
  const now = params.now ?? new Date();
  const staleProcessingBefore = new Date(now.getTime() - 2 * 60 * 1000);
  const circuitWindow = new Date(now.getTime() - 10 * 60 * 1000);

  await prisma.aIUsage.updateMany({
    where: { status: "processing", createdAt: { lt: staleProcessingBefore } },
    data: { status: "failed" },
  });

  return prisma.$transaction(async (transaction) => {
    // Serialize content-free admission across Vercel instances. The lock is
    // released before the external API call starts.
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext('moodday:ai:admission'))
    `;

    const successfulThisMonth = await transaction.aIUsage.count({
      where: {
        userId: params.userId,
        periodKey: params.periodKey,
        status: { in: ["processing", "succeeded"] },
      },
    });
    if (successfulThisMonth >= params.monthlyUserLimit) {
      return { admitted: false, reason: "monthly_quota" };
    }

    const recentGeneration = await transaction.aIUsage.findUnique({
      where: { requestKey: params.requestKey },
      select: { id: true },
    });
    if (recentGeneration) {
      return { admitted: false, reason: "daily_limit" };
    }

    // The operational budget counts all model attempts, including validated
    // fallbacks and failures, so repeated provider errors cannot bypass it.
    const globalMonthly = await transaction.aIUsage.count({
      where: {
        periodKey: params.periodKey,
        status: { in: ["processing", "succeeded", "fallback", "failed"] },
      },
    });
    const activeRequests = await transaction.aIUsage.count({
      where: { status: "processing" },
    });
    const recentFailures = await transaction.aIUsage.count({
      where: { status: "failed", createdAt: { gte: circuitWindow } },
    });
    if (
      globalMonthly >= env.AI_MONTHLY_REQUEST_BUDGET ||
      activeRequests >= env.AI_MAX_CONCURRENCY ||
      recentFailures >= 5
    ) {
      return { admitted: false, reason: "temporarily_unavailable" };
    }

    const usage = await transaction.aIUsage.create({
      data: {
        userId: params.userId,
        requestKey: params.requestKey,
        periodKey: params.periodKey,
        status: "processing",
        model: params.model,
        promptVersion: params.promptVersion,
      },
      select: { id: true },
    });
    return { admitted: true, usageId: usage.id };
  });
}

export async function markAiUsageBlockedForCrisis(params: {
  usageId: string;
  requestKey: string;
  latencyMs: number;
}) {
  await prisma.aIUsage.update({
    where: { id: params.usageId },
    data: {
      // Releasing the daily key ensures a safety interruption consumes
      // neither the monthly generation quota nor the one-generation/day slot.
      requestKey: `${params.requestKey}:blocked:${params.usageId}`,
      status: "blocked",
      safetyCategory: "self-harm",
      latencyMs: params.latencyMs,
    },
  });
}

/* eslint-disable no-await-in-loop -- recovery is deliberately bounded and sequential */

import {
  getSafeRevenueCatErrorCode,
  isRevenueCatConfigured,
  syncRevenueCatCustomer,
} from "@/lib/billing/revenuecat";
import { validateCronRequest } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { runOperationalJob } from "@/lib/operations/job-runner";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const BATCH_SIZE = 20;

async function recoverRevenueCatEvents(requestContext: {
  requestId: string;
  startedAt: number;
}) {
  const candidates = await prisma.billingEvent.findMany({
    where: {
      provider: { in: ["app_store", "play_store"] },
      userId: { not: null },
      status: { in: ["received", "failed"] },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, userId: true, eventType: true },
  });
  let processed = 0;
  let failed = 0;
  for (const candidate of candidates) {
    if (!candidate.userId) continue;
    try {
      await syncRevenueCatCustomer(candidate.userId);
      await prisma.billingEvent.update({
        where: { id: candidate.id },
        data: { status: "processed", processedAt: new Date(), errorCode: null },
      });
      processed += 1;
    } catch (error) {
      const errorCode = getSafeRevenueCatErrorCode(error);
      await prisma.billingEvent.update({
        where: { id: candidate.id },
        data: { status: "failed", errorCode },
      });
      logger.error("RevenueCat webhook recovery failed", {
        eventName: "revenuecat_webhook_recovery_failed",
        eventType: candidate.eventType,
        status: "failed",
        errorCode,
        ...getRequestLogFields({
          ...requestContext,
          route: "/api/cron/revenuecat-webhooks",
        }),
      });
      failed += 1;
    }
  }
  if (failed > 0) {
    const error = new Error("revenuecat_webhook_recovery_failed");
    error.name = "revenuecat_webhook_recovery_failed";
    throw error;
  }
  return { examined: candidates.length, processed };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;
  if (!isRevenueCatConfigured()) {
    return NextResponse.json({ ok: true, disabled: true });
  }
  const job = await runOperationalJob({
    jobName: "revenuecat-webhooks",
    intervalMs: 60_000,
    task: async () => recoverRevenueCatEvents({ requestId, startedAt }),
  });
  if (job.skipped) return NextResponse.json({ ok: true, skipped: true });
  return NextResponse.json({ ok: true, ...job.result });
}

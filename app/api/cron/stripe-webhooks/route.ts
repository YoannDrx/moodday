/* eslint-disable no-await-in-loop -- recovery claims are deliberately bounded and sequential */

import {
  getSafeStripeWebhookErrorCode,
  processStripeWebhookEvent,
} from "@/lib/billing/stripe-webhook-processor";
import { validateCronRequest } from "@/lib/cron";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { runOperationalJob } from "@/lib/operations/job-runner";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const STALE_PROCESSING_MS = 5 * 60_000;
const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 20;

async function recoverStripeWebhookEvents(requestContext: {
  requestId: string;
  startedAt: number;
}) {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const candidates = await prisma.stripeWebhookEvent.findMany({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: "failed" },
        { status: "processing", updatedAt: { lt: staleBefore } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, eventId: true, type: true, attempts: true },
  });

  let processed = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const claim = await prisma.stripeWebhookEvent.updateMany({
      where: {
        id: candidate.id,
        attempts: { lt: MAX_ATTEMPTS },
        OR: [
          { status: "failed" },
          { status: "processing", updatedAt: { lt: staleBefore } },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        lastErrorCode: null,
      },
    });
    if (claim.count !== 1) continue;

    try {
      // The raw webhook body is deliberately not persisted. Stripe's event ID
      // is sufficient to recover the signed event from the provider API.
      const event = await getStripe().events.retrieve(candidate.eventId);
      await processStripeWebhookEvent(event);
      await prisma.stripeWebhookEvent.update({
        where: { id: candidate.id },
        data: { status: "processed", processedAt: new Date() },
      });
      processed += 1;
    } catch (error) {
      const errorCode = getSafeStripeWebhookErrorCode(error);
      const exhausted = candidate.attempts + 1 >= MAX_ATTEMPTS;
      await prisma.stripeWebhookEvent.update({
        where: { id: candidate.id },
        data: {
          status: exhausted ? "dead" : "failed",
          lastErrorCode: errorCode,
        },
      });
      logger.error("Stripe webhook recovery failed", {
        eventName: "stripe_webhook_recovery_failed",
        status: exhausted ? "dead" : "failed",
        eventType: candidate.type,
        errorCode,
        ...getRequestLogFields({
          ...requestContext,
          route: "/api/cron/stripe-webhooks",
        }),
      });
      failed += 1;
    }
  }

  if (failed > 0) {
    const error = new Error("stripe_webhook_recovery_failed");
    error.name = "stripe_webhook_recovery_failed";
    throw error;
  }
  return { examined: candidates.length, processed };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;
  if (!env.BILLING_ENABLED) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  const job = await runOperationalJob({
    jobName: "stripe-webhooks",
    intervalMs: 60_000,
    task: async () => recoverStripeWebhookEvents({ requestId, startedAt }),
  });

  if (job.skipped) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  return NextResponse.json({ ok: true, ...job.result });
}

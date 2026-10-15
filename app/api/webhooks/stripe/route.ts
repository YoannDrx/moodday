import { env } from "@/lib/env";
import { isMaintenanceMode, maintenanceApiResponse } from "@/lib/maintenance";
import { logger } from "@/lib/logger";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { scheduleAfterResponse } from "@/lib/operations/after-response";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  getSafeStripeWebhookErrorCode,
  processStripeWebhookEvent,
} from "@/lib/billing/stripe-webhook-processor";
import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

export const maxDuration = 60;

async function claimEvent(event: Stripe.Event) {
  try {
    return await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        stripeCreatedAt: new Date(event.created * 1000),
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  const staleBefore = new Date(Date.now() - 5 * 60_000);
  const retry = await prisma.stripeWebhookEvent.updateMany({
    where: {
      eventId: event.id,
      attempts: { lt: 8 },
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
  if (retry.count !== 1) return null;
  return prisma.stripeWebhookEvent.findUniqueOrThrow({
    where: { eventId: event.id },
  });
}

async function processClaimedEvent(params: {
  claimId: string;
  event: Stripe.Event;
  requestId: string;
  startedAt: number;
}) {
  try {
    await processStripeWebhookEvent(params.event);
    await prisma.stripeWebhookEvent.update({
      where: { id: params.claimId },
      data: { status: "processed", processedAt: new Date() },
    });
  } catch (error) {
    const errorCode = getSafeStripeWebhookErrorCode(error);
    logger.error("Stripe webhook processing failed", {
      eventName: "stripe_webhook_failed",
      status: "failed",
      eventType: params.event.type,
      errorCode,
      ...getRequestLogFields({
        requestId: params.requestId,
        route: "/api/webhooks/stripe",
        startedAt: params.startedAt,
      }),
    });
    await prisma.stripeWebhookEvent.update({
      where: { id: params.claimId },
      data: { status: "failed", lastErrorCode: errorCode },
    });
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);
  if (isMaintenanceMode()) return maintenanceApiResponse();
  const signature = req.headers.get("stripe-signature");
  if (!env.BILLING_ENABLED) {
    return NextResponse.json({ ok: true, disabled: true });
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await req.text(),
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const claimed = await claimEvent(event);
  if (!claimed) return NextResponse.json({ ok: true, duplicate: true });

  // Stripe gets its 2xx as soon as the signed event is durably claimed. Next's
  // after() keeps the normal path low-latency, while the recovery cron retries
  // failed or interrupted claims by retrieving the event from Stripe by ID.
  scheduleAfterResponse(async () =>
    processClaimedEvent({
      claimId: claimed.id,
      event,
      requestId,
      startedAt,
    }),
  );

  return NextResponse.json({ ok: true, queued: true });
}

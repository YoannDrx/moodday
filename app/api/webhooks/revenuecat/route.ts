import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSafeRevenueCatErrorCode,
  syncRevenueCatCustomer,
} from "@/lib/billing/revenuecat";
import {
  getRevenueCatCandidateUserIds,
  isRevenueCatWebhookInScope,
  revenueCatWebhookSchema,
  verifyRevenueCatAuthorization,
  verifyRevenueCatSignature,
  type RevenueCatWebhook,
} from "@/lib/billing/revenuecat-webhook";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { isMaintenanceMode, maintenanceApiResponse } from "@/lib/maintenance";
import { scheduleAfterResponse } from "@/lib/operations/after-response";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

async function resolveUsers(event: RevenueCatWebhook["event"]) {
  const candidateIds = getRevenueCatCandidateUserIds(event);
  if (candidateIds.length === 0) return [];
  return prisma.user.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true },
  });
}

async function processClaimedEvent(params: {
  billingEventId: string;
  event: RevenueCatWebhook["event"];
  userIds: string[];
  requestId: string;
  startedAt: number;
}) {
  try {
    if (params.event.type === "TEST" || params.userIds.length === 0) {
      await prisma.billingEvent.update({
        where: { id: params.billingEventId },
        data: { status: "ignored", processedAt: new Date() },
      });
      return;
    }
    await Promise.all(
      params.userIds.map(async (userId) => syncRevenueCatCustomer(userId)),
    );
    await prisma.billingEvent.update({
      where: { id: params.billingEventId },
      data: { status: "processed", processedAt: new Date(), errorCode: null },
    });
  } catch (error) {
    const errorCode = getSafeRevenueCatErrorCode(error);
    await prisma.billingEvent.update({
      where: { id: params.billingEventId },
      data: { status: "failed", errorCode },
    });
    logger.error("RevenueCat webhook processing failed", {
      eventName: "revenuecat_webhook_failed",
      eventType: params.event.type,
      status: "failed",
      errorCode,
      ...getRequestLogFields({
        requestId: params.requestId,
        route: "/api/webhooks/revenuecat",
        startedAt: params.startedAt,
      }),
    });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  if (isMaintenanceMode()) return maintenanceApiResponse();
  if (
    !env.REVENUECAT_WEBHOOK_AUTH_TOKEN ||
    !env.REVENUECAT_WEBHOOK_SIGNING_SECRET
  ) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }
  const rawBody = await request.text();
  if (!verifyRevenueCatAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json(
      { error: "Invalid authorization" },
      { status: 401 },
    );
  }
  if (
    !verifyRevenueCatSignature({
      header: request.headers.get("x-revenuecat-webhook-signature"),
      rawBody,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const parsed = revenueCatWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const event = parsed.data.event;
  if (!isRevenueCatWebhookInScope(event)) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  const users = await resolveUsers(event);
  let claimed;
  try {
    claimed = await prisma.billingEvent.create({
      data: {
        userId: users[0]?.id,
        provider: event.store === "PLAY_STORE" ? "play_store" : "app_store",
        externalEventId: event.id,
        eventType: event.type,
        occurredAt: new Date(event.event_timestamp_ms),
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
    const retry = await prisma.billingEvent.updateMany({
      where: {
        provider: event.store === "PLAY_STORE" ? "play_store" : "app_store",
        externalEventId: event.id,
        status: "failed",
      },
      data: { status: "received", errorCode: null },
    });
    if (retry.count === 0) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    claimed = await prisma.billingEvent.findUniqueOrThrow({
      where: {
        provider_externalEventId: {
          provider: event.store === "PLAY_STORE" ? "play_store" : "app_store",
          externalEventId: event.id,
        },
      },
    });
  }

  scheduleAfterResponse(async () =>
    processClaimedEvent({
      billingEventId: claimed.id,
      event,
      userIds: users.map(({ id }) => id),
      requestId,
      startedAt,
    }),
  );
  return NextResponse.json({ ok: true, queued: true });
}

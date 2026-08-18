import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { isMaintenanceMode, maintenanceApiResponse } from "@/lib/maintenance";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

const ResendWebhookSchema = z.object({
  type: z.string().max(100),
  created_at: z.string().datetime(),
  data: z
    .object({
      email_id: z.string().max(255).optional(),
    })
    .passthrough(),
});

type EmailStatus =
  | "delivered"
  | "bounced"
  | "complained"
  | "opened"
  | "clicked";

const statusMap: Record<string, EmailStatus> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
};

const statusRank: Record<string, number> = {
  sent: 0,
  delivered: 1,
  opened: 2,
  clicked: 3,
  bounced: 4,
  complained: 5,
};

const timestampFieldMap = {
  delivered: "deliveredAt",
  bounced: "bouncedAt",
  complained: "complainedAt",
  opened: "openedAt",
  clicked: "clickedAt",
} as const;

const invalidSignature = () =>
  Response.json({ code: "invalid_webhook_signature" }, { status: 401 });

export const POST = async (request: NextRequest) => {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  if (isMaintenanceMode()) return maintenanceApiResponse();
  if (!env.RESEND_WEBHOOK_SECRET) {
    return Response.json({ code: "webhook_unavailable" }, { status: 503 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return invalidSignature();

  const timestampSeconds = Number(svixTimestamp);
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (
    !Number.isFinite(timestampSeconds) ||
    ageSeconds > MAX_WEBHOOK_AGE_SECONDS
  ) {
    return invalidSignature();
  }

  const rawBody = await request.text();
  let verifiedPayload: unknown;
  try {
    verifiedPayload = new Webhook(env.RESEND_WEBHOOK_SECRET).verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return invalidSignature();
  }

  const parsed = ResendWebhookSchema.safeParse(verifiedPayload);
  if (!parsed.success) {
    return Response.json({ code: "invalid_webhook_payload" }, { status: 400 });
  }
  const event = parsed.data;
  const providerCreatedAt = new Date(event.created_at);

  try {
    await prisma.emailWebhookEvent.create({
      data: {
        svixId,
        type: event.type,
        providerCreatedAt,
        status: "processing",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const claimedRetry = await prisma.emailWebhookEvent.updateMany({
        where: { svixId, status: "retry" },
        data: { status: "processing", attempts: { increment: 1 } },
      });
      if (claimedRetry.count === 0) {
        return Response.json({ ok: true, duplicate: true });
      }
    } else {
      throw error;
    }
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const resendId = event.data.email_id;
      const newStatus = resendId ? statusMap[event.type] : undefined;
      if (resendId && newStatus) {
        const current = await transaction.emailLog.findUnique({
          where: { resendId },
        });
        if (current) {
          const timestampField = timestampFieldMap[newStatus];
          const currentTimestamp = current[timestampField];
          await transaction.emailLog.update({
            where: { resendId },
            data: {
              ...(statusRank[newStatus] >= (statusRank[current.status] ?? 0)
                ? { status: newStatus }
                : {}),
              ...(currentTimestamp && currentTimestamp >= providerCreatedAt
                ? {}
                : { [timestampField]: providerCreatedAt }),
            },
          });
        }
      }

      await transaction.emailWebhookEvent.update({
        where: { svixId },
        data: { status: "succeeded", processedAt: new Date() },
      });
    });
    logger.info("Resend webhook processed", {
      eventName: "resend_webhook_processed",
      eventType: event.type,
      status: "succeeded",
      ...getRequestLogFields({
        requestId,
        route: "/api/webhooks/resend",
        startedAt,
      }),
    });
    return Response.json({ ok: true });
  } catch (error) {
    await prisma.emailWebhookEvent.updateMany({
      where: { svixId, status: "processing" },
      data: {
        status: "retry",
        attempts: { increment: 1 },
        lastErrorCode: error instanceof Error ? error.name : "unknown_error",
      },
    });
    logger.error("Resend webhook processing failed", {
      eventName: "resend_webhook_failed",
      eventType: event.type,
      status: "retry",
      errorCode: error instanceof Error ? error.name : "unknown_error",
      ...getRequestLogFields({
        requestId,
        route: "/api/webhooks/resend",
        startedAt,
      }),
    });
    return Response.json(
      { code: "webhook_processing_failed" },
      { status: 500 },
    );
  }
};

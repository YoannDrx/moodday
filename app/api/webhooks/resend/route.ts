import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ResendWebhookSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  data: z
    .object({
      email_id: z.string().optional(),
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

const timestampFieldMap: Record<EmailStatus, string> = {
  delivered: "deliveredAt",
  bounced: "bouncedAt",
  complained: "complainedAt",
  opened: "openedAt",
  clicked: "clickedAt",
};

/**
 * Resend webhooks
 *
 * @docs How it work https://resend.com/docs/dashboard/webhooks/introduction
 * @docs Event type https://resend.com/docs/dashboard/webhooks/event-types
 */
export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const event = ResendWebhookSchema.parse(body);
  const resendId = event.data.email_id;

  // Update EmailLog if we have a resendId and a known status
  const newStatus = resendId ? statusMap[event.type] : undefined;
  if (resendId && newStatus) {
    const timestampField = timestampFieldMap[newStatus];
    try {
      await prisma.emailLog.update({
        where: { resendId },
        data: {
          status: newStatus,
          [timestampField]: new Date(),
        },
      });
      logger.info(`[Resend Webhook] Updated email status to ${newStatus}`, {
        resendId,
        eventType: event.type,
      });
    } catch (err) {
      // Email might not exist in our DB (sent before tracking was enabled)
      logger.warn("[Resend Webhook] Email not found in DB", {
        resendId,
        eventType: event.type,
        err,
      });
    }
  }

  // Log warnings for specific events
  switch (event.type) {
    case "email.complained":
      logger.warn("Email complained", event.data);
      break;
    case "email.bounced":
      logger.warn("Email bounced", event.data);
      break;
  }

  return NextResponse.json({
    ok: true,
  });
};

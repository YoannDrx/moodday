import { sendTrialReminderEmail } from "@/lib/auth/stripe/subscription-emails";
import { validateCronRequest } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { runOperationalJob } from "@/lib/operations/job-runner";
import {
  addCivilDays,
  getCivilDayRange,
  getDateKeyForTimeZone,
} from "@/lib/temporal/civil-date";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";

export const maxDuration = 300;

export const GET = route.handler(async (request) => {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const job = await runOperationalJob({
    jobName: "subscription-reminders",
    intervalMs: 24 * 60 * 60 * 1000,
    task: async () => sendSubscriptionReminders({ requestId, startedAt }),
  });
  return job.skipped ? { ok: true, skipped: true } : job.result;
});

async function sendSubscriptionReminders(requestContext: {
  requestId: string;
  startedAt: number;
}) {
  const today = getDateKeyForTimeZone(new Date(), "UTC");
  const in3Days = getCivilDayRange(addCivilDays(today, 3), "UTC");
  const in1Day = getCivilDayRange(addCivilDays(today, 1), "UTC");

  // Find trials expiring in 3 days
  const trialsExpiring3Days = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      periodEnd: {
        gte: in3Days.start,
        lt: in3Days.endExclusive,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  // Find trials expiring tomorrow
  const trialsExpiring1Day = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      periodEnd: {
        gte: in1Day.start,
        lt: in1Day.endExclusive,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  // Send reminders in parallel
  const results3Days = await Promise.allSettled(
    trialsExpiring3Days.map(async (sub) => sendTrialReminderEmail(sub, 3)),
  );

  const results1Day = await Promise.allSettled(
    trialsExpiring1Day.map(async (sub) => sendTrialReminderEmail(sub, 1)),
  );

  const sent3Days = results3Days.filter((r) => r.status === "fulfilled").length;
  const sent1Day = results1Day.filter((r) => r.status === "fulfilled").length;

  // Log failures
  results3Days.forEach((result) => {
    if (result.status === "rejected") {
      logger.error("[subscription-reminders] Failed to send J-3 reminder", {
        eventName: "subscription_reminder_delivery_failed",
        status: "failed",
        errorCode: "email_delivery_failed",
        ...getRequestLogFields({
          ...requestContext,
          route: "/api/cron/subscription-reminders",
        }),
      });
    }
  });

  results1Day.forEach((result) => {
    if (result.status === "rejected") {
      logger.error("[subscription-reminders] Failed to send J-1 reminder", {
        eventName: "subscription_reminder_delivery_failed",
        status: "failed",
        errorCode: "email_delivery_failed",
        ...getRequestLogFields({
          ...requestContext,
          route: "/api/cron/subscription-reminders",
        }),
      });
    }
  });

  logger.info("[subscription-reminders] Cron completed", {
    eventName: "subscription_reminders_completed",
    status: "succeeded",
    trialsChecked3Days: trialsExpiring3Days.length,
    trialsChecked1Day: trialsExpiring1Day.length,
    sent3Days,
    sent1Day,
    ...getRequestLogFields({
      ...requestContext,
      route: "/api/cron/subscription-reminders",
    }),
  });

  return {
    ok: true,
    trialsChecked3Days: trialsExpiring3Days.length,
    trialsChecked1Day: trialsExpiring1Day.length,
    sent3Days,
    sent1Day,
  };
}

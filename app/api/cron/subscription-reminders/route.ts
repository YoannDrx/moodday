import { sendTrialReminderEmail } from "@/lib/auth/stripe/subscription-emails";
import { validateCronRequest } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { addDays, startOfDay } from "date-fns";

export const maxDuration = 300;

export const GET = route.handler(async (request) => {
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const today = startOfDay(new Date());
  const in3Days = startOfDay(addDays(today, 3));
  const in1Day = startOfDay(addDays(today, 1));
  const in3DaysEnd = startOfDay(addDays(in3Days, 1));
  const in1DayEnd = startOfDay(addDays(in1Day, 1));

  // Find trials expiring in 3 days
  const trialsExpiring3Days = await prisma.subscription.findMany({
    where: {
      status: "trialing",
      periodEnd: {
        gte: in3Days,
        lt: in3DaysEnd,
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
        gte: in1Day,
        lt: in1DayEnd,
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
        errorCode: "email_delivery_failed",
      });
    }
  });

  results1Day.forEach((result) => {
    if (result.status === "rejected") {
      logger.error("[subscription-reminders] Failed to send J-1 reminder", {
        errorCode: "email_delivery_failed",
      });
    }
  });

  logger.info("[subscription-reminders] Cron completed", {
    trialsChecked3Days: trialsExpiring3Days.length,
    trialsChecked1Day: trialsExpiring1Day.length,
    sent3Days,
    sent1Day,
  });

  return {
    ok: true,
    trialsChecked3Days: trialsExpiring3Days.length,
    trialsChecked1Day: trialsExpiring1Day.length,
    sent3Days,
    sent1Day,
  };
});

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildPushPayload, getWebPush } from "@/lib/push";
import { route } from "@/lib/zod-route";

export const maxDuration = 300;

const getSafeTimeZone = (timezone?: string | null) => {
  if (!timezone) return "UTC";
  try {
    Intl.DateTimeFormat("en-GB", { timeZone: timezone });
    return timezone;
  } catch {
    return "UTC";
  }
};

const getLocalTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

const getLocalDateKey = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const sendToSubscriptions = async (
  subscriptions: {
    endpoint: string;
    p256dh: string;
    auth: string;
    expirationTime: Date | null;
  }[],
  payload: ReturnType<typeof buildPushPayload>,
) => {
  const webPush = getWebPush();
  if (!webPush) return 0;

  let sent = 0;

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
          expirationTime: subscription.expirationTime
            ? subscription.expirationTime.getTime()
            : undefined,
        },
        payload,
      );
      sent += 1;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { endpoint: subscription.endpoint },
        });
      }
    }
  }

  return sent;
};

export const GET = route.handler(async (request) => {
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!getWebPush()) {
    return new Response(
      JSON.stringify({ error: "VAPID keys not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const now = new Date();
  const preferences = await prisma.userPreferences.findMany({
    where: {
      notificationsEnabled: true,
      OR: [{ dailyCheckInReminder: true }, { medicationReminders: true }],
    },
  });

  let checkInsSent = 0;
  let medsSent = 0;

  for (const pref of preferences) {
    const timeZone = getSafeTimeZone(pref.timezone);
    const localTime = getLocalTime(now, timeZone);
    const localDateKey = getLocalDateKey(now, timeZone);

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: pref.userId },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
        expirationTime: true,
      },
    });

    if (subscriptions.length === 0) continue;

    if (
      pref.dailyCheckInReminder &&
      localTime === pref.dailyCheckInTime &&
      pref.lastDailyCheckInSentDate !== localDateKey
    ) {
      const payload = buildPushPayload({
        title: "Moodday - Check-in",
        body: "Pensez a enregistrer votre humeur du jour.",
        url: "/mood",
        tag: "daily-checkin",
      });

      const sent = await sendToSubscriptions(subscriptions, payload);
      if (sent > 0) {
        checkInsSent += 1;
        await prisma.userPreferences.update({
          where: { userId: pref.userId },
          data: { lastDailyCheckInSentDate: localDateKey },
        });
      }
    }

    if (
      pref.medicationReminders &&
      localTime === pref.medicationReminderTime &&
      pref.lastMedicationReminderSentDate !== localDateKey
    ) {
      const payload = buildPushPayload({
        title: "Moodday - Medicaments",
        body: "Petit rappel pour vos prises aujourd'hui.",
        url: "/medications/today",
        tag: "medication-reminder",
      });

      const sent = await sendToSubscriptions(subscriptions, payload);
      if (sent > 0) {
        medsSent += 1;
        await prisma.userPreferences.update({
          where: { userId: pref.userId },
          data: { lastMedicationReminderSentDate: localDateKey },
        });
      }
    }
  }

  return {
    ok: true,
    usersChecked: preferences.length,
    checkInsSent,
    medsSent,
  };
});

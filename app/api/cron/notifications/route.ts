/* eslint-disable no-await-in-loop -- sequential notification sending required */
import { runLifecycleEmails } from "@/features/couple/lifecycle.service";
import { deliverScheduledNotifications } from "@/features/couple/notify.service";
import {
  claimNotificationDelivery,
  completeNotificationDeliveries,
  createEndpointDeliveryKey,
  shouldAttemptNotificationDelivery,
} from "@/features/notifications/delivery";
import {
  getLocalTime,
  getSafeTimeZone,
  isReminderDue,
} from "@/features/notifications/schedule";
import { validateCronRequest } from "@/lib/cron";
import { env } from "@/lib/env";
import { getFeatureAvailability } from "@/lib/features/availability";
import { processExternalDeletionJobs } from "@/lib/operations/external-deletions";
import { runOperationalJob } from "@/lib/operations/job-runner";
import { applyOperationalRetention } from "@/lib/operations/retention";
import { prisma } from "@/lib/prisma";
import { buildPushPayload, getWebPush } from "@/lib/push";
import { getDateKeyForTimeZone } from "@/lib/temporal/civil-date";
import { route } from "@/lib/zod-route";

export const maxDuration = 300;

type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime: Date | null;
};

const sendToSubscription = async (
  subscription: PushSubscriptionRecord,
  payload: ReturnType<typeof buildPushPayload>,
) => {
  const webPush = getWebPush();
  if (!webPush) return { sent: false, errorCode: "vapid_not_configured" };

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        expirationTime: subscription.expirationTime
          ? subscription.expirationTime.getTime()
          : undefined,
      },
      payload,
    );
    return { sent: true };
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      });
      return { sent: false, errorCode: "push_subscription_gone" };
    }
    return { sent: false, errorCode: "push_delivery_failed" };
  }
};

/** Daily "Mon point" reminder for cycle owners. Generic text only. */
const sendDailyReminders = async (now: Date) => {
  const preferences = await prisma.userPreferences.findMany({
    where: {
      notificationsEnabled: true,
      dailyCheckInReminder: true,
      user: { profile: { role: "cycle_owner" } },
    },
  });
  let sent = 0;

  for (const pref of preferences) {
    const timeZone = getSafeTimeZone(pref.timezone);
    const localTime = getLocalTime(now, timeZone);
    const localDateKey = getDateKeyForTimeZone(now, timeZone);
    if (pref.lastDailyCheckInSentDate === localDateKey) continue;

    const alreadyCheckedIn = await prisma.dailyCheckIn.count({
      where: {
        userId: pref.userId,
        localDate: new Date(`${localDateKey}T00:00:00.000Z`),
      },
    });
    if (alreadyCheckedIn > 0) continue;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: pref.userId, disabledAt: null },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
        expirationTime: true,
      },
    });
    if (subscriptions.length === 0) continue;

    const dueRetryKeys = new Set(
      (
        await prisma.notificationDelivery.findMany({
          where: {
            userId: pref.userId,
            status: "failed",
            nextAttemptAt: { lte: now },
          },
          select: { deliveryKey: true },
        })
      ).map((delivery) => delivery.deliveryKey),
    );

    let sentToAtLeastOneEndpoint = false;
    for (const subscription of subscriptions) {
      const deliveryKey = createEndpointDeliveryKey(
        `daily-checkin:${localDateKey}`,
        subscription.endpoint,
      );
      if (
        !shouldAttemptNotificationDelivery({
          currentlyDue: isReminderDue(localTime, pref.dailyCheckInTime),
          deliveryKey,
          dueRetryKeys,
        })
      ) {
        continue;
      }
      const claimed = await claimNotificationDelivery({
        userId: pref.userId,
        deliveryKey,
        now,
      });
      if (!claimed) continue;

      const result = await sendToSubscription(
        subscription,
        buildPushPayload({
          title: "Moodday",
          body: "Petit point du jour ? Dix secondes, promis.",
          url: "/today",
          tag: "daily-checkin",
        }),
      );
      await completeNotificationDeliveries({
        userId: pref.userId,
        deliveryKeys: [deliveryKey],
        sent: result.sent,
        errorCode: result.errorCode,
        now,
      });
      sentToAtLeastOneEndpoint ||= result.sent;
    }

    if (sentToAtLeastOneEndpoint) {
      sent += 1;
      await prisma.userPreferences.update({
        where: { userId: pref.userId },
        data: { lastDailyCheckInSentDate: localDateKey },
      });
    }
  }

  return { usersChecked: preferences.length, sent };
};

export const GET = route.handler(async (request) => {
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const externalDeletions = await runOperationalJob({
    jobName: "external-deletions",
    intervalMs: 5 * 60 * 1000,
    task: processExternalDeletionJobs,
  });

  const retention = await runOperationalJob({
    jobName: "operational-retention",
    intervalMs: 24 * 60 * 60 * 1000,
    task: applyOperationalRetention,
  });

  // Partner notifications deferred by quiet hours. Expo push needs no VAPID
  // configuration, so this runs whatever the web push availability.
  const partnerNotifications = await runOperationalJob({
    jobName: "partner-notifications",
    intervalMs: 5 * 60 * 1000,
    task: async () => deliverScheduledNotifications(new Date()),
  });

  // Onboarding sequence: hourly, and only when transactional email works.
  const lifecycleEmails = env.RESEND_API_KEY
    ? await runOperationalJob({
        jobName: "lifecycle-emails",
        intervalMs: 60 * 60 * 1000,
        task: async () => runLifecycleEmails(new Date()),
      })
    : null;

  if (!getFeatureAvailability("pushNotifications").enabled || !getWebPush()) {
    return {
      ok: true,
      disabled: true,
      externalDeletions,
      retention,
      partnerNotifications,
      lifecycleEmails,
    };
  }

  const reminders = await runOperationalJob({
    jobName: "notifications",
    intervalMs: 5 * 60 * 1000,
    task: async () => sendDailyReminders(new Date()),
  });

  return {
    externalDeletions,
    retention,
    partnerNotifications,
    lifecycleEmails,
    reminders,
  };
});

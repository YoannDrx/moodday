/* eslint-disable no-await-in-loop -- sequential notification sending required */
import { validateCronRequest } from "@/lib/cron";
import {
  buildMedicationDoseSlots,
  createMedicationReminderKey,
  getDateKeyForTimeZone,
  isIntakeForDateInTimeZone,
  normalizeScheduleTimesForFrequency,
} from "@/features/medication/schedule";
import { prisma } from "@/lib/prisma";
import { buildPushPayload, getWebPush } from "@/lib/push";
import { route } from "@/lib/zod-route";
import {
  claimNotificationDelivery,
  completeNotificationDeliveries,
  createEndpointDeliveryKey,
} from "@/features/notifications/delivery";
import {
  getLocalTime,
  getSafeTimeZone,
  isReminderDue,
} from "@/features/notifications/schedule";

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

const getTodayMedicationReminderKeys = (keys: string[], localDateKey: string) =>
  keys.filter((key) => key.startsWith(`${localDateKey}:`));

export const GET = route.handler(async (request) => {
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;

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
    const localDateKey = getDateKeyForTimeZone(now, timeZone);

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
      isReminderDue(localTime, pref.dailyCheckInTime)
    ) {
      const payload = buildPushPayload({
        title: "Moodday - Check-in",
        body: "Pensez a enregistrer votre humeur du jour.",
        url: "/mood",
        tag: "daily-checkin",
      });
      let sentToAtLeastOneEndpoint = false;

      for (const subscription of subscriptions) {
        const deliveryKey = createEndpointDeliveryKey(
          `daily-checkin:${localDateKey}`,
          subscription.endpoint,
        );
        const claimed = await claimNotificationDelivery({
          userId: pref.userId,
          deliveryKey,
          now,
        });
        if (!claimed) continue;

        const result = await sendToSubscription(subscription, payload);
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
        checkInsSent += 1;
        await prisma.userPreferences.update({
          where: { userId: pref.userId },
          data: { lastDailyCheckInSentDate: localDateKey },
        });
      }
    }

    if (pref.medicationReminders) {
      // Legacy intake rows have no local scheduled date. Query a deliberately
      // broad UTC window, then classify them using the user's IANA timezone.
      const legacyLookbackStart = new Date(now.getTime() - 36 * 60 * 60 * 1000);
      const medications = await prisma.medication.findMany({
        where: {
          userId: pref.userId,
          isArchived: false,
          isPRN: false,
        },
        include: {
          intakes: {
            where: {
              OR: [
                { scheduledForDate: localDateKey },
                {
                  scheduledForDate: null,
                  takenAt: { gte: legacyLookbackStart, lte: now },
                },
              ],
            },
            orderBy: { takenAt: "desc" },
          },
        },
      });
      const sentReminderKeys =
        pref.lastMedicationReminderSentDate === localDateKey
          ? getTodayMedicationReminderKeys(
              pref.lastMedicationReminderSentKeys,
              localDateKey,
            )
          : [];
      const dueDoseSlots = medications.flatMap((medication) => {
        const scheduleTimes =
          medication.scheduleTimes.length > 0
            ? medication.scheduleTimes
            : normalizeScheduleTimesForFrequency(medication.frequency, [
                pref.medicationReminderTime,
              ]);

        return buildMedicationDoseSlots(
          {
            ...medication,
            scheduleTimes,
            intakes: medication.intakes.filter((intake) =>
              isIntakeForDateInTimeZone(intake, localDateKey, timeZone),
            ),
          },
          localDateKey,
        )
          .filter(
            (slot) =>
              slot.status === "pending" &&
              slot.scheduledTime !== null &&
              isReminderDue(localTime, slot.scheduledTime),
          )
          .map((slot) => ({
            medication,
            slot,
            reminderKey: createMedicationReminderKey(
              medication.id,
              localDateKey,
              slot.doseIndex,
              slot.scheduledTime,
            ),
          }));
      });

      if (dueDoseSlots.length === 0) continue;

      const successfullySentReminderKeys = new Set<string>();
      for (const subscription of subscriptions) {
        const claimedDoseSlots: typeof dueDoseSlots = [];
        const claimedDeliveryKeys: string[] = [];

        for (const dueDoseSlot of dueDoseSlots) {
          const deliveryKey = createEndpointDeliveryKey(
            `medication:${dueDoseSlot.reminderKey}`,
            subscription.endpoint,
          );
          const claimed = await claimNotificationDelivery({
            userId: pref.userId,
            deliveryKey,
            now,
          });
          if (claimed) {
            claimedDoseSlots.push(dueDoseSlot);
            claimedDeliveryKeys.push(deliveryKey);
          }
        }

        if (claimedDoseSlots.length === 0) continue;

        const payload = buildPushPayload({
          title: "Moodday - Medicaments",
          body:
            claimedDoseSlots.length === 1
              ? `Rappel pour ${claimedDoseSlots[0]?.medication.name}.`
              : `${claimedDoseSlots.length} prises sont prevues maintenant.`,
          url: "/medications/today",
          tag: `medication-reminder-${localDateKey}-${claimedDoseSlots[0]?.slot.scheduledTime ?? "now"}`,
        });
        const result = await sendToSubscription(subscription, payload);

        await completeNotificationDeliveries({
          userId: pref.userId,
          deliveryKeys: claimedDeliveryKeys,
          sent: result.sent,
          errorCode: result.errorCode,
          now,
        });

        if (result.sent) {
          for (const { reminderKey } of claimedDoseSlots) {
            successfullySentReminderKeys.add(reminderKey);
          }
        }
      }

      if (successfullySentReminderKeys.size > 0) {
        medsSent += 1;
        await prisma.userPreferences.update({
          where: { userId: pref.userId },
          data: {
            lastMedicationReminderSentDate: localDateKey,
            lastMedicationReminderSentKeys: Array.from(
              new Set([...sentReminderKeys, ...successfullySentReminderKeys]),
            ),
          },
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

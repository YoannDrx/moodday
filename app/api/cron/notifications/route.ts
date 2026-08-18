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
  shouldAttemptNotificationDelivery,
} from "@/features/notifications/delivery";
import {
  getLocalTime,
  getSafeTimeZone,
  isReminderDue,
} from "@/features/notifications/schedule";
import { getFeatureAvailability } from "@/lib/features/availability";
import { runOperationalJob } from "@/lib/operations/job-runner";
import { processExternalDeletionJobs } from "@/lib/operations/external-deletions";
import { applyOperationalRetention } from "@/lib/operations/retention";
import { getEffectivePushContentMode } from "@/features/pwa/push-privacy";

export const maxDuration = 300;

type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime: Date | null;
  locale: string;
  contentMode: string;
  trustedDevice: boolean;
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

  if (!getFeatureAvailability("pushNotifications").enabled) {
    return { ok: true, disabled: true, externalDeletions, retention };
  }

  const notifications = await runOperationalJob({
    jobName: "notifications",
    intervalMs: 5 * 60 * 1000,
    task: async () => {
      if (!getWebPush()) {
        throw new Error("push_configuration_unavailable");
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
            locale: true,
            contentMode: true,
            trustedDevice: true,
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

        if (pref.dailyCheckInReminder) {
          let sentToAtLeastOneEndpoint = false;

          for (const subscription of subscriptions) {
            const payload = buildPushPayload({
              title: "Moodday",
              body:
                subscription.locale === "en"
                  ? "A reminder is ready in Moodday."
                  : "Un rappel vous attend dans Moodday.",
              url: "/mood",
              tag: "daily-checkin",
            });
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
          const legacyLookbackStart = new Date(
            now.getTime() - 36 * 60 * 60 * 1000,
          );
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
          const candidateDoseSlots = medications.flatMap((medication) => {
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
                  slot.status === "pending" && slot.scheduledTime !== null,
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

          if (candidateDoseSlots.length === 0) continue;

          const successfullySentReminderKeys = new Set<string>();
          for (const subscription of subscriptions) {
            const claimedDoseSlots: typeof candidateDoseSlots = [];
            const claimedDeliveryKeys: string[] = [];

            for (const dueDoseSlot of candidateDoseSlots) {
              const deliveryKey = createEndpointDeliveryKey(
                `medication:${dueDoseSlot.reminderKey}`,
                subscription.endpoint,
              );
              if (
                !shouldAttemptNotificationDelivery({
                  currentlyDue: isReminderDue(
                    localTime,
                    dueDoseSlot.slot.scheduledTime ?? "",
                  ),
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
              if (claimed) {
                claimedDoseSlots.push(dueDoseSlot);
                claimedDeliveryKeys.push(deliveryKey);
              }
            }

            if (claimedDoseSlots.length === 0) continue;

            const detailed =
              getEffectivePushContentMode(subscription) === "detailed";
            const payload = buildPushPayload({
              title: "Moodday",
              body:
                detailed && claimedDoseSlots.length === 1
                  ? subscription.locale === "en"
                    ? `Medication reminder for ${claimedDoseSlots[0]?.medication.name}.`
                    : `Rappel de traitement pour ${claimedDoseSlots[0]?.medication.name}.`
                  : subscription.locale === "en"
                    ? "A medication reminder is ready in Moodday."
                    : "Un rappel de traitement vous attend dans Moodday.",
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
                  new Set([
                    ...sentReminderKeys,
                    ...successfullySentReminderKeys,
                  ]),
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
    },
  });
  return { externalDeletions, retention, notifications };
});

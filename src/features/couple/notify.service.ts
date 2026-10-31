import "server-only";

import {
  claimNotificationDelivery,
  completeNotificationDeliveries,
} from "@/features/notifications/delivery";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { buildPushPayload, getWebPush } from "@/lib/push";
import { getSafeTimeZone } from "@/lib/temporal/civil-date";
import {
  checkInNotification,
  findGesture,
  gestureNotification,
  labelForNeed,
  localTimeInTimeZone,
  minutesUntilQuietHoursEnd,
  type NotificationText,
} from "@moodday/domain";
import { toCivil } from "./shared";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const sendWebPush = async (
  userId: string,
  text: NotificationText,
  tag: string,
) => {
  const webPush = getWebPush();
  if (!webPush) return false;
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, disabledAt: null },
  });
  const payload = buildPushPayload({
    ...text,
    tag,
    icon: "/icons/icon-192.png",
  });
  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        );
        return true;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: subscription.endpoint },
          });
        }
        return false;
      }
    }),
  );
  return results.some(Boolean);
};

const sendExpoPush = async (userId: string, text: NotificationText) => {
  const devices = await prisma.device.findMany({
    where: { userId, revokedAt: null, pushToken: { not: null } },
    select: { pushToken: true },
  });
  if (devices.length === 0) return false;
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(
        devices.map((device) => ({
          to: device.pushToken,
          title: text.title,
          body: text.body,
          data: { url: text.url },
          sound: "default",
          categoryId: text.url === "/today" ? "moodday_today" : undefined,
        })),
      ),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/** Builds the text at send time, so nothing sensitive is ever stored. */
const buildText = async (
  deliveryKey: string,
): Promise<{ text: NotificationText; recipientId: string } | null> => {
  const [kind, reference, extra] = deliveryKey.split(":");

  if (kind === "partner-checkin" && reference && extra) {
    const checkIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: reference,
        localDate: new Date(`${extra}T00:00:00.000Z`),
      },
      include: { user: { select: { profile: true, name: true } } },
    });
    const link = await prisma.coupleLink.findFirst({
      where: { ownerId: reference, status: "active" },
    });
    if (!checkIn || !link?.supporterId) return null;
    if (link.pausedUntil && link.pausedUntil > new Date()) return null;
    if (link.level === "cycle_only") return null;
    const customNeeds = await prisma.customNeed.findMany({
      where: { userId: reference },
      select: { id: true, label: true },
    });
    const firstNeed =
      link.level === "cycle_state_needs" && checkIn.needs[0]
        ? labelForNeed(checkIn.needs[0], customNeeds)
        : null;
    return {
      recipientId: link.supporterId,
      text: checkInNotification({
        ownerName: checkIn.user.profile?.displayName ?? checkIn.user.name,
        state: checkIn.state,
        firstNeedLabel: firstNeed,
        detailed: link.detailedPreviews,
      }),
    };
  }

  if (kind === "gesture" && reference) {
    const gesture = await prisma.gesture.findUnique({
      where: { id: reference },
      include: {
        link: true,
        sender: { select: { name: true, profile: true } },
      },
    });
    if (!gesture || gesture.link.status !== "active") return null;
    return {
      recipientId: gesture.recipientId,
      text: gestureNotification({
        senderName: gesture.sender.profile?.displayName ?? gesture.sender.name,
        gestureLabel:
          gesture.kind === "custom"
            ? (gesture.message ?? "Un petit mot")
            : (findGesture(gesture.kind)?.label ?? "Un geste"),
        detailed: gesture.link.detailedPreviews,
      }),
    };
  }

  if (kind === "gesture-thanks" && reference) {
    const gesture = await prisma.gesture.findUnique({
      where: { id: reference },
      include: { recipient: { select: { name: true, profile: true } } },
    });
    if (!gesture) return null;
    const name =
      gesture.recipient.profile?.displayName ?? gesture.recipient.name;
    return {
      recipientId: gesture.senderId,
      text: { title: "Moodday", body: `${name} t'a dit merci.`, url: "/today" },
    };
  }

  if (
    (kind === "link-accepted" || kind === "link-ended") &&
    reference &&
    extra
  ) {
    return {
      recipientId: extra,
      text:
        kind === "link-accepted"
          ? {
              title: "Moodday",
              body: "Votre duo est formé. Bienvenue à deux.",
              url: "/duo",
            }
          : {
              title: "Moodday",
              body: "Le partage Moodday a été arrêté.",
              url: "/duo",
            },
    };
  }

  return null;
};

const deliver = async (deliveryKey: string) => {
  const built = await buildText(deliveryKey);
  if (!built) return "skipped" as const;

  const claimed = await claimNotificationDelivery({
    userId: built.recipientId,
    deliveryKey,
  });
  if (!claimed) return "duplicate" as const;

  const [web, expo] = await Promise.all([
    sendWebPush(
      built.recipientId,
      built.text,
      deliveryKey.split(":")[0] ?? "moodday",
    ),
    sendExpoPush(built.recipientId, built.text),
  ]);
  const sent = web || expo;
  await completeNotificationDeliveries({
    userId: built.recipientId,
    deliveryKeys: [deliveryKey],
    sent,
    errorCode: sent ? undefined : "no_reachable_device",
  });
  return sent ? ("sent" as const) : ("unreachable" as const);
};

/**
 * Sends now, or defers until the recipient's quiet hours end. Deferred
 * notifications are picked up by the notifications cron.
 */
export const queuePartnerNotification = async (deliveryKey: string) => {
  try {
    const built = await buildText(deliveryKey);
    if (!built) return "skipped";
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: built.recipientId },
      select: { timezone: true, quietHoursStart: true, quietHoursEnd: true },
    });
    const timeZone = getSafeTimeZone(preferences?.timezone);
    const wait = minutesUntilQuietHoursEnd(
      localTimeInTimeZone(new Date(), timeZone),
      preferences?.quietHoursStart,
      preferences?.quietHoursEnd,
    );
    if (wait > 0) {
      await prisma.notificationDelivery.upsert({
        where: {
          userId_deliveryKey: { userId: built.recipientId, deliveryKey },
        },
        create: {
          userId: built.recipientId,
          deliveryKey,
          status: "scheduled",
          attempts: 0,
          nextAttemptAt: new Date(Date.now() + wait * 60_000),
        },
        update: {},
      });
      return "scheduled";
    }
    return await deliver(deliveryKey);
  } catch (error) {
    // A notification failure must never fail the user's own action.
    logger.warn("Partner notification failed", {
      eventName: "partner_notification_failed",
      status: "failed",
      errorCode: (error as Error).name,
    });
    return "failed";
  }
};

/** Delivers deferred notifications whose quiet hours are over. */
export const deliverScheduledNotifications = async (now = new Date()) => {
  const due = await prisma.notificationDelivery.findMany({
    where: { status: "scheduled", nextAttemptAt: { lte: now } },
    take: 200,
    orderBy: { nextAttemptAt: "asc" },
  });
  let sent = 0;
  for (const delivery of due) {
    // eslint-disable-next-line no-await-in-loop -- bounded sequential batch
    await prisma.notificationDelivery.delete({ where: { id: delivery.id } });
    // eslint-disable-next-line no-await-in-loop -- bounded sequential batch
    if ((await deliver(delivery.deliveryKey)) === "sent") sent += 1;
  }
  return { due: due.length, sent };
};

export const checkInDeliveryKey = (ownerId: string, localDate: Date) =>
  `partner-checkin:${ownerId}:${toCivil(localDate)}`;

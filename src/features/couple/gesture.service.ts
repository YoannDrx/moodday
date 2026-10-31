import "server-only";

import { prisma } from "@/lib/prisma";
import type { GestureDto, SendGestureInput } from "@moodday/contracts";
import { findGesture } from "@moodday/domain";
import { queuePartnerNotification } from "./notify.service";
import { CoupleError, isUniqueViolation } from "./shared";

const DAILY_GESTURE_LIMIT = 12;

export const sendGesture = async (
  senderId: string,
  input: SendGestureInput,
) => {
  if (input.kind !== "custom" && !findGesture(input.kind)) {
    throw new CoupleError("unknown_gesture", "Ce geste n'existe pas (encore).");
  }
  const link = await prisma.coupleLink.findFirst({
    where: { supporterId: senderId, status: "active" },
  });
  const ownerId = link?.ownerId;
  if (!link || !ownerId) {
    throw new CoupleError(
      "no_link",
      "Il faut un duo actif pour envoyer un geste.",
    );
  }

  const replay = await prisma.gesture.findUnique({
    where: {
      senderId_operationId: { senderId, operationId: input.operationId },
    },
  });
  if (replay) return replay;

  if (input.checkInId) {
    const visible =
      link.level !== "cycle_only" &&
      !(link.pausedUntil && link.pausedUntil > new Date()) &&
      (await prisma.dailyCheckIn.count({
        where: { id: input.checkInId, userId: ownerId },
      })) === 1;
    if (!visible) {
      throw new CoupleError(
        "check_in_not_visible",
        "Ce point n'est pas partagé avec toi.",
      );
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.gesture.count({
    where: { senderId, createdAt: { gte: since } },
  });
  if (recent >= DAILY_GESTURE_LIMIT) {
    throw new CoupleError(
      "too_many_gestures",
      "Douze gestes en un jour : respire, champion·ne.",
    );
  }

  try {
    const gesture = await prisma.$transaction(async (tx) => {
      const created = await tx.gesture.create({
        data: {
          linkId: link.id,
          senderId,
          recipientId: ownerId,
          checkInId: input.checkInId,
          operationId: input.operationId,
          kind: input.kind,
          message: input.message?.trim() ? input.message.trim() : null,
        },
      });
      await tx.accessLog.create({
        data: {
          ownerId,
          actorId: senderId,
          linkId: link.id,
          action: "gesture_sent",
          resourceKind: "gesture",
        },
      });
      return created;
    });
    await queuePartnerNotification(`gesture:${gesture.id}`);
    return gesture;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    return prisma.gesture.findUniqueOrThrow({
      where: {
        senderId_operationId: { senderId, operationId: input.operationId },
      },
    });
  }
};

export const thankGesture = async (recipientId: string, gestureId: string) => {
  const updated = await prisma.gesture.updateMany({
    where: { id: gestureId, recipientId, status: { not: "thanked" } },
    data: { status: "thanked", thankedAt: new Date() },
  });
  if (updated.count === 1)
    await queuePartnerNotification(`gesture-thanks:${gestureId}`);
};

export const markGesturesSeen = async (recipientId: string) =>
  prisma.gesture.updateMany({
    where: { recipientId, status: "sent" },
    data: { status: "seen", seenAt: new Date() },
  });

/** Gestures of the active link only: ending a link hides the shared history. */
export const listGestures = async (
  userId: string,
  take = 20,
): Promise<GestureDto[]> => {
  const link = await prisma.coupleLink.findFirst({
    where: {
      status: "active",
      OR: [{ ownerId: userId }, { supporterId: userId }],
    },
    select: { id: true },
  });
  if (!link) return [];
  const gestures = await prisma.gesture.findMany({
    where: { linkId: link.id },
    orderBy: { createdAt: "desc" },
    take,
  });
  return gestures.map((gesture) => ({
    id: gesture.id,
    kind: gesture.kind,
    label:
      gesture.kind === "custom"
        ? (gesture.message ?? "Un petit mot")
        : (findGesture(gesture.kind)?.label ?? "Un geste"),
    message: gesture.kind === "custom" ? null : gesture.message,
    status: gesture.status,
    fromMe: gesture.senderId === userId,
    createdAt: gesture.createdAt.toISOString(),
  }));
};

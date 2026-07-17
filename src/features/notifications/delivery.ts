import { prisma } from "@/lib/prisma";

const MAX_DELIVERY_ATTEMPTS = 3;
const STALE_CLAIM_MS = 10 * 60 * 1000;

const isUniqueConstraintError = (error: unknown) =>
  (error as { code?: string } | null)?.code === "P2002";

export const claimNotificationDelivery = async (params: {
  userId: string;
  deliveryKey: string;
  now?: Date;
}) => {
  const now = params.now ?? new Date();

  try {
    await prisma.notificationDelivery.create({
      data: {
        userId: params.userId,
        deliveryKey: params.deliveryKey,
        claimedAt: now,
      },
    });
    return true;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);
  const retry = await prisma.notificationDelivery.updateMany({
    where: {
      userId: params.userId,
      deliveryKey: params.deliveryKey,
      attempts: { lt: MAX_DELIVERY_ATTEMPTS },
      OR: [
        { status: "failed" },
        { status: "pending", claimedAt: { lt: staleBefore } },
      ],
    },
    data: {
      status: "pending",
      claimedAt: now,
      attempts: { increment: 1 },
      failedAt: null,
    },
  });

  return retry.count === 1;
};

export const completeNotificationDeliveries = async (params: {
  userId: string;
  deliveryKeys: string[];
  sent: boolean;
  now?: Date;
}) => {
  if (params.deliveryKeys.length === 0) return;

  const now = params.now ?? new Date();
  await prisma.notificationDelivery.updateMany({
    where: {
      userId: params.userId,
      deliveryKey: { in: params.deliveryKeys },
      status: "pending",
    },
    data: params.sent
      ? { status: "sent", sentAt: now, failedAt: null }
      : { status: "failed", failedAt: now },
  });
};

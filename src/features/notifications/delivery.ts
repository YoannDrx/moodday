import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

const MAX_DELIVERY_ATTEMPTS = 3;
const STALE_CLAIM_MS = 10 * 60 * 1000;
const RETRY_DELAY_MS = 5 * 60 * 1000;

const isUniqueConstraintError = (error: unknown) =>
  (error as { code?: string } | null)?.code === "P2002";

export const createEndpointDeliveryKey = (
  deliveryKey: string,
  endpoint: string,
) => {
  const endpointKey = createHash("sha256")
    .update(endpoint)
    .digest("base64url")
    .slice(0, 24);

  return `${deliveryKey}:endpoint:${endpointKey}`;
};

export const shouldAttemptNotificationDelivery = (params: {
  currentlyDue: boolean;
  deliveryKey: string;
  dueRetryKeys: ReadonlySet<string>;
}) => params.currentlyDue || params.dueRetryKeys.has(params.deliveryKey);

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
        nextAttemptAt: null,
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
      AND: [
        {
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
      ],
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
      nextAttemptAt: null,
      lastErrorCode: null,
    },
  });

  return retry.count === 1;
};

export const completeNotificationDeliveries = async (params: {
  userId: string;
  deliveryKeys: string[];
  sent: boolean;
  errorCode?: string;
  now?: Date;
}) => {
  if (params.deliveryKeys.length === 0) return;

  const now = params.now ?? new Date();
  const deliveryWhere = {
    userId: params.userId,
    deliveryKey: { in: params.deliveryKeys },
    status: "pending",
  } as const;

  if (params.sent) {
    await prisma.notificationDelivery.updateMany({
      where: deliveryWhere,
      data: {
        status: "sent",
        sentAt: now,
        failedAt: null,
        nextAttemptAt: null,
        lastErrorCode: null,
      },
    });
    return;
  }

  const errorCode = params.errorCode ?? "push_delivery_failed";
  await prisma.$transaction([
    prisma.notificationDelivery.updateMany({
      where: { ...deliveryWhere, attempts: { lt: MAX_DELIVERY_ATTEMPTS } },
      data: {
        status: "failed",
        failedAt: now,
        nextAttemptAt: new Date(now.getTime() + RETRY_DELAY_MS),
        lastErrorCode: errorCode,
      },
    }),
    prisma.notificationDelivery.updateMany({
      where: { ...deliveryWhere, attempts: { gte: MAX_DELIVERY_ATTEMPTS } },
      data: {
        status: "dead",
        failedAt: now,
        nextAttemptAt: null,
        lastErrorCode: errorCode,
      },
    }),
  ]);
};

import {
  claimNotificationDelivery,
  completeNotificationDeliveries,
} from "@/features/notifications/delivery";
import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("claims a notification once across concurrent workers", async ({
  page,
}) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });
  const user = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
        select: { id: true },
      }),
    { maxAttempts: 5, delayMs: 250, backoff: true },
  );
  const deliveryKey = "daily-checkin:2026-07-16";
  const now = new Date("2026-07-16T10:00:00.000Z");

  const claims = await Promise.all([
    claimNotificationDelivery({ userId: user.id, deliveryKey, now }),
    claimNotificationDelivery({ userId: user.id, deliveryKey, now }),
  ]);

  expect(claims.filter(Boolean)).toHaveLength(1);

  await completeNotificationDeliveries({
    userId: user.id,
    deliveryKeys: [deliveryKey],
    sent: true,
    now,
  });

  await expect(
    prisma.notificationDelivery.findUnique({
      where: {
        userId_deliveryKey: { userId: user.id, deliveryKey },
      },
      select: {
        status: true,
        attempts: true,
        sentAt: true,
      },
    }),
  ).resolves.toEqual({ status: "sent", attempts: 1, sentAt: now });
});

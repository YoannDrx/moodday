import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificationDelivery: {
      create: mocks.create,
      updateMany: mocks.updateMany,
    },
  },
}));

import {
  claimNotificationDelivery,
  completeNotificationDeliveries,
  createEndpointDeliveryKey,
} from "../src/features/notifications/delivery";

describe("notification delivery claims", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.updateMany.mockReset();
  });

  it("isolates idempotency per endpoint without storing the endpoint", () => {
    const baseKey = "daily-checkin:2026-08-10";
    const endpointA = "https://push.example.test/subscription-a";
    const endpointB = "https://push.example.test/subscription-b";

    const keyA = createEndpointDeliveryKey(baseKey, endpointA);
    const keyB = createEndpointDeliveryKey(baseKey, endpointB);

    expect(keyA).not.toBe(keyB);
    expect(keyA).toMatch(/^daily-checkin:2026-08-10:endpoint:[\w-]{24}$/);
    expect(keyA).not.toContain(endpointA);
  });

  it("claims a new delivery exactly once", async () => {
    mocks.create.mockResolvedValue({ id: "delivery-1" });

    await expect(
      claimNotificationDelivery({
        userId: "user-1",
        deliveryKey: "daily-checkin:2026-07-16",
      }),
    ).resolves.toBe(true);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a duplicate delivery that is already claimed or sent", async () => {
    mocks.create.mockRejectedValue({ code: "P2002" });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      claimNotificationDelivery({
        userId: "user-1",
        deliveryKey: "daily-checkin:2026-07-16",
      }),
    ).resolves.toBe(false);
  });

  it("reclaims a failed or stale delivery with a bounded attempt count", async () => {
    const now = new Date("2026-07-16T10:00:00.000Z");
    mocks.create.mockRejectedValue({ code: "P2002" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      claimNotificationDelivery({
        userId: "user-1",
        deliveryKey: "medication:slot-1",
        now,
      }),
    ).resolves.toBe(true);

    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ attempts: { lt: 3 } }),
        data: expect.objectContaining({ attempts: { increment: 1 } }),
      }),
    );
  });

  it("marks only pending claimed keys as sent", async () => {
    const now = new Date("2026-07-16T10:00:00.000Z");
    mocks.updateMany.mockResolvedValue({ count: 2 });

    await completeNotificationDeliveries({
      userId: "user-1",
      deliveryKeys: ["medication:slot-1", "medication:slot-2"],
      sent: true,
      now,
    });

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        deliveryKey: {
          in: ["medication:slot-1", "medication:slot-2"],
        },
        status: "pending",
      },
      data: {
        status: "sent",
        sentAt: now,
        failedAt: null,
        nextAttemptAt: null,
        lastErrorCode: null,
      },
    });
  });

  it("stores only an expurgated retry code after a failed delivery", async () => {
    const now = new Date("2026-07-16T10:00:00.000Z");
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await completeNotificationDeliveries({
      userId: "user-1",
      deliveryKeys: ["daily-checkin:2026-07-16"],
      sent: false,
      now,
    });

    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "failed",
          lastErrorCode: "push_delivery_failed",
          nextAttemptAt: new Date("2026-07-16T10:05:00.000Z"),
        }),
      }),
    );
  });
});

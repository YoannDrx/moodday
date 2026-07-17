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
} from "../src/features/notifications/delivery";

describe("notification delivery claims", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.updateMany.mockReset();
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
      data: { status: "sent", sentAt: now, failedAt: null },
    });
  });
});

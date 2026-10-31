import { prisma } from "@/lib/prisma";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  getWebPush: vi.fn(),
}));

vi.mock("@/features/notifications/delivery", () => ({
  claimNotificationDelivery: mocks.claim,
  completeNotificationDeliveries: mocks.complete,
}));
vi.mock("@/lib/push", () => ({
  getWebPush: mocks.getWebPush,
  buildPushPayload: (payload: unknown) => JSON.stringify(payload),
}));

import {
  deliverScheduledNotifications,
  queuePartnerNotification,
} from "@/features/couple/notify.service";

const fetchMock = vi.fn<typeof fetch>();

const activeLink = (overrides: Record<string, unknown> = {}) => ({
  id: "link-1",
  ownerId: "lea",
  supporterId: "tom",
  status: "active",
  level: "cycle_state_needs",
  detailedPreviews: false,
  pausedUntil: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  mocks.claim.mockResolvedValue(true);
  mocks.getWebPush.mockReturnValue(null);
  vi.mocked(prisma.dailyCheckIn.findFirst).mockResolvedValue({
    state: "hard",
    needs: ["calm"],
    user: { name: "Léa Martin", profile: { displayName: "Léa" } },
  } as never);
  vi.mocked(prisma.customNeed.findMany).mockResolvedValue([]);
  vi.mocked(prisma.device.findMany).mockResolvedValue([
    { pushToken: "ExponentPushToken[synthetic]" },
  ] as never);
  vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
    timezone: "Europe/Paris",
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  } as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const sentBodies = () =>
  fetchMock.mock.calls.map(
    (call) => JSON.parse(String(call[1]?.body)) as unknown[],
  );

describe("partner notifications", () => {
  it("sends a generic text to the partner during the day", async () => {
    vi.setSystemTime(new Date("2026-10-30T16:00:00Z")); // 17:00 in Paris
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(
      activeLink() as never,
    );

    await expect(
      queuePartnerNotification("partner-checkin:lea:2026-10-30"),
    ).resolves.toBe("sent");

    expect(mocks.claim).toHaveBeenCalledWith({
      userId: "tom",
      deliveryKey: "partner-checkin:lea:2026-10-30",
    });
    const [messages] = sentBodies();
    expect(messages).toEqual([
      expect.objectContaining({
        to: "ExponentPushToken[synthetic]",
        title: "Moodday",
        body: "Léa a partagé son point du jour.",
      }),
    ]);
    expect(JSON.stringify(messages)).not.toMatch(/difficile|calme/u);
  });

  it("shows the state only when she enabled detailed previews", async () => {
    vi.setSystemTime(new Date("2026-10-30T16:00:00Z"));
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(
      activeLink({ detailedPreviews: true }) as never,
    );

    await queuePartnerNotification("partner-checkin:lea:2026-10-30");

    expect(sentBodies()[0]).toEqual([
      expect.objectContaining({
        title: "Léa : difficile",
        body: "Elle aimerait : du calme.",
      }),
    ]);
  });

  it("defers to the end of the partner's quiet hours", async () => {
    vi.setSystemTime(new Date("2026-10-30T22:30:00Z")); // 23:30 in Paris
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(
      activeLink() as never,
    );

    await expect(
      queuePartnerNotification("partner-checkin:lea:2026-10-30"),
    ).resolves.toBe("scheduled");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.notificationDelivery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: "tom",
          status: "scheduled",
          nextAttemptAt: new Date("2026-10-31T07:00:00.000Z"),
        }),
      }),
    );
  });

  it("sends nothing while sharing is paused or limited to the cycle", async () => {
    vi.setSystemTime(new Date("2026-10-30T16:00:00Z"));
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValueOnce(
      activeLink({ pausedUntil: new Date("2026-10-31T16:00:00Z") }) as never,
    );
    await expect(
      queuePartnerNotification("partner-checkin:lea:2026-10-30"),
    ).resolves.toBe("skipped");

    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValueOnce(
      activeLink({ level: "cycle_only" }) as never,
    );
    await expect(
      queuePartnerNotification("partner-checkin:lea:2026-10-30"),
    ).resolves.toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never fails the user's action when delivery breaks", async () => {
    vi.setSystemTime(new Date("2026-10-30T16:00:00Z"));
    vi.mocked(prisma.coupleLink.findFirst).mockRejectedValue(
      new Error("db down"),
    );
    await expect(
      queuePartnerNotification("partner-checkin:lea:2026-10-30"),
    ).resolves.toBe("failed");
  });

  it("delivers deferred notifications once quiet hours are over", async () => {
    vi.setSystemTime(new Date("2026-10-31T07:05:00Z"));
    vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValue([
      { id: "delivery-1", deliveryKey: "partner-checkin:lea:2026-10-30" },
    ] as never);
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(
      activeLink() as never,
    );

    await expect(deliverScheduledNotifications()).resolves.toEqual({
      due: 1,
      sent: 1,
    });
    expect(prisma.notificationDelivery.delete).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
    });
  });
});

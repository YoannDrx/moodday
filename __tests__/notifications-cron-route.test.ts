import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const mocks = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  getFeatureAvailability: vi.fn(),
  runOperationalJob: vi.fn(),
  processExternalDeletionJobs: vi.fn(),
  applyOperationalRetention: vi.fn(),
  getWebPush: vi.fn(),
  sendNotification: vi.fn(),
  buildPushPayload: vi.fn(),
  claimNotificationDelivery: vi.fn(),
  completeNotificationDeliveries: vi.fn(),
  shouldAttemptNotificationDelivery: vi.fn(),
  getLocalTime: vi.fn(),
  isReminderDue: vi.fn(),
  deliverScheduledNotifications: vi.fn(),
}));

vi.mock("@/features/couple/lifecycle.service", () => ({
  runLifecycleEmails: vi.fn(),
}));
vi.mock("@/features/couple/notify.service", () => ({
  deliverScheduledNotifications: mocks.deliverScheduledNotifications,
}));

vi.mock("@/lib/cron", () => ({
  validateCronRequest: mocks.validateCronRequest,
}));
vi.mock("@/lib/features/availability", () => ({
  getFeatureAvailability: mocks.getFeatureAvailability,
}));
vi.mock("@/lib/operations/job-runner", () => ({
  runOperationalJob: mocks.runOperationalJob,
}));
vi.mock("@/lib/operations/external-deletions", () => ({
  processExternalDeletionJobs: mocks.processExternalDeletionJobs,
}));
vi.mock("@/lib/operations/retention", () => ({
  applyOperationalRetention: mocks.applyOperationalRetention,
}));
vi.mock("@/lib/push", () => ({
  getWebPush: mocks.getWebPush,
  buildPushPayload: mocks.buildPushPayload,
}));
vi.mock("@/features/notifications/delivery", async () => {
  const actual = await vi.importActual("@/features/notifications/delivery");
  return {
    ...actual,
    claimNotificationDelivery: mocks.claimNotificationDelivery,
    completeNotificationDeliveries: mocks.completeNotificationDeliveries,
    shouldAttemptNotificationDelivery: mocks.shouldAttemptNotificationDelivery,
  };
});
vi.mock("@/features/notifications/schedule", async () => {
  const actual = await vi.importActual("@/features/notifications/schedule");
  return {
    ...actual,
    getLocalTime: mocks.getLocalTime,
    isReminderDue: mocks.isReminderDue,
  };
});

import { GET } from "@app/api/cron/notifications/route";

const request = new Request("http://localhost/api/cron/notifications");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-21T08:00:00Z"));
  vi.clearAllMocks();
  mocks.validateCronRequest.mockReturnValue(null);
  mocks.getFeatureAvailability.mockReturnValue({ enabled: true });
  mocks.processExternalDeletionJobs.mockResolvedValue({ processed: 0 });
  mocks.applyOperationalRetention.mockResolvedValue({ deleted: 0 });
  mocks.runOperationalJob.mockImplementation(
    async ({ task }: { task: () => Promise<unknown> }) => task(),
  );
  mocks.getWebPush.mockReturnValue({
    sendNotification: mocks.sendNotification,
  });
  mocks.sendNotification.mockResolvedValue(undefined);
  mocks.buildPushPayload.mockImplementation((payload) =>
    JSON.stringify(payload),
  );
  mocks.claimNotificationDelivery.mockResolvedValue(true);
  mocks.completeNotificationDeliveries.mockResolvedValue(undefined);
  mocks.shouldAttemptNotificationDelivery.mockReturnValue(true);
  mocks.getLocalTime.mockReturnValue("08:00");
  mocks.isReminderDue.mockReturnValue(true);
  mocks.deliverScheduledNotifications.mockResolvedValue({ due: 0, sent: 0 });
});

afterEach(() => vi.useRealTimers());

describe("notification cron route", () => {
  it("delivers deferred partner notifications even when web push is disabled", async () => {
    mocks.getFeatureAvailability.mockReturnValue({
      enabled: false,
      reason: "disabled_by_flag",
    });
    const response = await GET(request, {} as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      disabled: true,
      externalDeletions: { processed: 0 },
      retention: { deleted: 0 },
      partnerNotifications: { due: 0, sent: 0 },
      // Without a mail provider the onboarding sequence stays idle.
      lifecycleEmails: null,
    });
    expect(mocks.deliverScheduledNotifications).toHaveBeenCalledTimes(1);
    expect(prisma.userPreferences.findMany).not.toHaveBeenCalled();
  });

  it("only reminds cycle owners who have not checked in today", async () => {
    vi.mocked(prisma.userPreferences.findMany).mockResolvedValue([
      {
        userId: "owner-1",
        timezone: "Europe/Paris",
        notificationsEnabled: true,
        dailyCheckInReminder: true,
        dailyCheckInTime: "10:00",
        lastDailyCheckInSentDate: null,
      },
      {
        userId: "owner-2",
        timezone: "Europe/Paris",
        notificationsEnabled: true,
        dailyCheckInReminder: true,
        dailyCheckInTime: "10:00",
        lastDailyCheckInSentDate: null,
      },
    ] as never);
    vi.mocked(prisma.dailyCheckIn.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        endpoint: "https://push.example/1",
        p256dh: "k",
        auth: "a",
        expirationTime: null,
      },
    ] as never);
    vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userPreferences.update).mockResolvedValue({} as never);

    const response = await GET(request, {} as never);
    const body = await response.json();

    expect(prisma.userPreferences.findMany).toHaveBeenCalledWith({
      where: {
        notificationsEnabled: true,
        dailyCheckInReminder: true,
        user: { profile: { role: "cycle_owner" } },
      },
    });
    expect(body.reminders).toEqual({ usersChecked: 2, sent: 1 });
    expect(mocks.sendNotification).toHaveBeenCalledTimes(1);
    expect(mocks.buildPushPayload).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/today", tag: "daily-checkin" }),
    );
    // The reminder text never carries any health detail.
    const payload = mocks.buildPushPayload.mock.calls[0]?.[0] as {
      body: string;
    };
    expect(payload.body).not.toMatch(/fragile|difficile|règles|SPM/i);
    expect(prisma.userPreferences.update).toHaveBeenCalledWith({
      where: { userId: "owner-1" },
      data: { lastDailyCheckInSentDate: "2026-09-21" },
    });
  });

  it("rejects unauthenticated cron calls before touching any job", async () => {
    mocks.validateCronRequest.mockReturnValue(
      Response.json({ error: "unauthorized" }, { status: 401 }),
    );
    const response = await GET(request, {} as never);
    expect(response.status).toBe(401);
    expect(mocks.runOperationalJob).not.toHaveBeenCalled();
  });
});

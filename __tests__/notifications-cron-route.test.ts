import { beforeEach, describe, expect, it, vi } from "vitest";
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
});

describe("notification cron route", () => {
  it("runs deletion and retention jobs while push remains disabled", async () => {
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
    });
    expect(prisma.userPreferences.findMany).not.toHaveBeenCalled();
  });

  it("claims and completes generic check-in and detailed medication deliveries", async () => {
    vi.mocked(prisma.userPreferences.findMany).mockResolvedValue([
      {
        userId: "notification-user",
        timezone: "Europe/Paris",
        notificationsEnabled: true,
        dailyCheckInReminder: true,
        dailyCheckInTime: "08:00",
        medicationReminders: true,
        medicationReminderTime: "08:00",
        lastMedicationReminderSentDate: null,
        lastMedicationReminderSentKeys: [],
      },
    ] as never);
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        endpoint: "https://push.moodday.invalid/fixture",
        p256dh: "fixture-p256dh",
        auth: "fixture-auth",
        expirationTime: null,
        locale: "fr",
        contentMode: "detailed",
        trustedDevice: true,
      },
    ] as never);
    vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValue([]);
    vi.mocked(prisma.medication.findMany).mockResolvedValue([
      {
        id: "medication-1",
        userId: "notification-user",
        name: "Synthetic",
        dosage: "fixture",
        frequency: "daily",
        isPRN: false,
        isArchived: false,
        scheduleTimes: ["08:00"],
        weeklyDay: null,
        startDate: null,
        endDate: null,
        intakes: [],
      },
    ] as never);
    vi.mocked(prisma.userPreferences.update).mockResolvedValue({} as never);

    const response = await GET(request, {} as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      externalDeletions: { processed: 0 },
      retention: { deleted: 0 },
      notifications: {
        ok: true,
        usersChecked: 1,
        checkInsSent: 1,
        medsSent: 1,
      },
    });
    expect(mocks.sendNotification).toHaveBeenCalledTimes(2);
    expect(mocks.completeNotificationDeliveries).toHaveBeenCalledTimes(2);
    expect(prisma.userPreferences.update).toHaveBeenCalledWith({
      where: { userId: "notification-user" },
      data: expect.objectContaining({
        lastMedicationReminderSentKeys: expect.any(Array),
      }),
    });
  });

  it("removes an expired endpoint and records the failed delivery", async () => {
    vi.mocked(prisma.userPreferences.findMany).mockResolvedValue([
      {
        userId: "notification-user",
        timezone: "Europe/Paris",
        notificationsEnabled: true,
        dailyCheckInReminder: true,
        dailyCheckInTime: "08:00",
        medicationReminders: false,
      },
    ] as never);
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        endpoint: "https://push.moodday.invalid/expired",
        p256dh: "fixture-p256dh",
        auth: "fixture-auth",
        expirationTime: null,
        locale: "en",
        contentMode: "generic",
        trustedDevice: false,
      },
    ] as never);
    vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValue([]);
    mocks.sendNotification.mockRejectedValueOnce({ statusCode: 410 });
    vi.mocked(prisma.pushSubscription.delete).mockResolvedValue({} as never);

    const response = await GET(request, {} as never);
    expect(response.status).toBe(200);
    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { endpoint: "https://push.moodday.invalid/expired" },
    });
    expect(mocks.completeNotificationDeliveries).toHaveBeenCalledWith(
      expect.objectContaining({
        sent: false,
        errorCode: "push_subscription_gone",
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));

import {
  completeOnboarding,
  getUserPreferences,
  updateDisplayPreferences,
  updateNotificationPreferences,
} from "@/features/preferences/preferences.action";

const user = { id: "preferences-user", email: "patient@moodday.invalid" };
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

describe("user preferences actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns existing preferences without creating a duplicate", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      userId: user.id,
      theme: "system",
    } as never);
    await expect(invoke(getUserPreferences)).resolves.toEqual(
      expect.objectContaining({ theme: "system" }),
    );
    expect(prisma.userPreferences.create).not.toHaveBeenCalled();
  });

  it("creates default preferences when none exist", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userPreferences.create).mockResolvedValue({
      userId: user.id,
    } as never);
    await invoke(getUserPreferences);
    expect(prisma.userPreferences.create).toHaveBeenCalledWith({
      data: { userId: user.id },
    });
  });

  it("completes onboarding idempotently", async () => {
    vi.mocked(prisma.userPreferences.upsert).mockResolvedValue({
      hasCompletedOnboarding: true,
    } as never);
    await invoke(completeOnboarding);
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: user.id },
      update: { hasCompletedOnboarding: true },
      create: { userId: user.id, hasCompletedOnboarding: true },
    });
  });

  it("updates display and notification preferences through owner-scoped upserts", async () => {
    vi.mocked(prisma.userPreferences.upsert).mockResolvedValue({
      userId: user.id,
    } as never);
    await invoke(updateDisplayPreferences, { theme: "dark" });
    await invoke(updateNotificationPreferences, {
      notificationsEnabled: true,
      dailyCheckInReminder: true,
      dailyCheckInTime: "09:30",
      quietHoursStart: "22:30",
    });
    expect(prisma.userPreferences.upsert).toHaveBeenNthCalledWith(1, {
      where: { userId: user.id },
      update: { theme: "dark" },
      create: { userId: user.id, theme: "dark" },
    });
    expect(prisma.userPreferences.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: user.id },
        update: expect.objectContaining({ dailyCheckInTime: "09:30" }),
      }),
    );
  });
});

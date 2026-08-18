import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  deleteUserAccountAtomically: vi.fn(),
  enqueueManagedProfileImageDeletion: vi.fn(),
}));

vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));
vi.mock("@/lib/user/delete-user-data", () => mocks);

import {
  deleteAccount,
  getSubscriptionSummary,
  updateProfile,
} from "@/features/profile/profile.action";

const user = {
  id: "profile-user",
  email: "patient@moodday.invalid",
  name: "Patient",
};
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      (callback as (transaction: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it("updates identity and timezone atomically and queues the old managed image", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      image: "https://blob.vercel-storage.com/old-avatar.png",
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: user.id,
      name: "Nouveau nom",
      email: user.email,
      image: "https://example.com/new-avatar.png",
    } as never);
    vi.mocked(prisma.userPreferences.upsert).mockResolvedValue({} as never);

    await invoke(updateProfile, {
      name: "Nouveau nom",
      timezone: "Pacific/Kiritimati",
      image: "https://example.com/new-avatar.png",
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: {
          name: "Nouveau nom",
          image: "https://example.com/new-avatar.png",
        },
      }),
    );
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: user.id },
      create: { userId: user.id, timezone: "Pacific/Kiritimati" },
      update: { timezone: "Pacific/Kiritimati" },
    });
    expect(mocks.enqueueManagedProfileImageDeletion).toHaveBeenCalledWith(
      prisma,
      user.id,
      "https://blob.vercel-storage.com/old-avatar.png",
    );
  });

  it("returns the current user without issuing optional writes when no field changes", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      image: null,
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: user.id,
      name: user.name,
      email: user.email,
      image: null,
    } as never);

    await expect(invoke(updateProfile, {})).resolves.toEqual(
      expect.objectContaining({ id: user.id }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.userPreferences.upsert).not.toHaveBeenCalled();
    expect(mocks.enqueueManagedProfileImageDeletion).not.toHaveBeenCalled();
  });

  it("supports explicit image removal and avoids deleting an unchanged image", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow)
      .mockResolvedValueOnce({
        image: "https://example.com/avatar.png",
      } as never)
      .mockResolvedValueOnce({
        image: "https://example.com/avatar.png",
      } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: user.id } as never);

    await invoke(updateProfile, { image: null });
    expect(mocks.enqueueManagedProfileImageDeletion).toHaveBeenCalledTimes(1);

    mocks.enqueueManagedProfileImageDeletion.mockClear();
    await invoke(updateProfile, { image: "https://example.com/avatar.png" });
    expect(mocks.enqueueManagedProfileImageDeletion).not.toHaveBeenCalled();
  });

  it("delegates account deletion to the atomic lifecycle service", async () => {
    mocks.deleteUserAccountAtomically.mockResolvedValue(undefined);
    await expect(invoke(deleteAccount)).resolves.toEqual({ success: true });
    expect(mocks.deleteUserAccountAtomically).toHaveBeenCalledWith(user);
  });

  it("returns a normalized subscription summary and a null Free state", async () => {
    vi.mocked(prisma.subscription.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        plan: "plus",
        status: "active",
        periodStart: new Date("2026-08-01T00:00:00.000Z"),
        periodEnd: null,
        cancelAtPeriodEnd: null,
      } as never);

    await expect(invoke(getSubscriptionSummary)).resolves.toBeNull();
    await expect(invoke(getSubscriptionSummary)).resolves.toEqual({
      plan: "plus",
      status: "active",
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });
});

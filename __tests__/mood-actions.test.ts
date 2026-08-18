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
  createMoodEntry,
  deleteMoodEntry,
  getMoodEntries,
  getTodayMoodEntry,
  saveMoodEntry,
  updateMoodEntry,
} from "@/features/mood/mood.action";

type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });
const user = { id: "user-1", email: "user@moodday.invalid" };
const createdAt = new Date("2026-08-13T08:00:00.000Z");

describe("mood actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
  });

  it("creates and updates a user's own entry while preserving zero", async () => {
    vi.mocked(prisma.moodEntry.create).mockResolvedValue({
      id: "mood-1",
      value: 0,
      note: null,
    } as never);
    expect(
      await invoke(createMoodEntry, { value: 0, note: undefined }),
    ).toEqual(expect.objectContaining({ value: 0 }));
    expect(prisma.moodEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        value: 0,
        note: null,
        syncStatus: "synced",
      }),
    });

    vi.mocked(prisma.moodEntry.findUnique).mockResolvedValue({
      userId: user.id,
    } as never);
    vi.mocked(prisma.moodEntry.update).mockResolvedValue({
      id: "mood-1",
      value: 4,
    } as never);
    await invoke(updateMoodEntry, { id: "mood-1", value: 4 });
    expect(prisma.moodEntry.update).toHaveBeenCalledWith({
      where: { id: "mood-1" },
      data: { value: 4, note: null },
    });
  });

  it("rejects missing and cross-account update or deletion", async () => {
    vi.mocked(prisma.moodEntry.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(updateMoodEntry, { id: "missing", value: 4 }),
    ).rejects.toThrow("Mood entry not found");

    vi.mocked(prisma.moodEntry.findUnique).mockResolvedValueOnce({
      userId: "another-user",
    } as never);
    await expect(invoke(deleteMoodEntry, { id: "mood-2" })).rejects.toThrow(
      "your own mood entries",
    );

    vi.mocked(prisma.moodEntry.findUnique).mockResolvedValueOnce(null);
    await expect(invoke(deleteMoodEntry, { id: "missing" })).rejects.toThrow(
      "Mood entry not found",
    );
  });

  it("deletes an owned entry", async () => {
    vi.mocked(prisma.moodEntry.findUnique).mockResolvedValue({
      userId: user.id,
    } as never);
    vi.mocked(prisma.moodEntry.delete).mockResolvedValue({} as never);

    await expect(invoke(deleteMoodEntry, { id: "mood-1" })).resolves.toEqual({
      success: true,
    });
    expect(prisma.moodEntry.delete).toHaveBeenCalledWith({
      where: { id: "mood-1" },
    });
  });

  it("returns timezone-bounded paginated entries and a stable cursor", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      { id: "mood-3" },
      { id: "mood-2" },
      { id: "mood-1" },
    ] as never);

    const result = await invoke<{
      entries: { id: string }[];
      nextCursor?: string;
      hasMore: boolean;
    }>(getMoodEntries, { days: 7, limit: 2, cursor: "previous" });

    expect(result).toEqual({
      entries: [{ id: "mood-3" }, { id: "mood-2" }],
      nextCursor: "mood-2",
      hasMore: true,
    });
    expect(prisma.moodEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: user.id,
          createdAt: { gte: expect.any(Date), lt: expect.any(Date) },
        }),
        take: 3,
        cursor: { id: "previous" },
        skip: 1,
      }),
    );

    vi.mocked(prisma.moodEntry.findMany).mockResolvedValueOnce([]);
    await expect(
      invoke(getMoodEntries, { days: undefined, limit: 2 }),
    ).resolves.toEqual({ entries: [], nextCursor: undefined, hasMore: false });
  });

  it("returns today's most recent entry and fails when none exists", async () => {
    vi.mocked(prisma.moodEntry.findFirst).mockResolvedValueOnce({
      id: "mood-1",
      value: 0,
      createdAt,
    } as never);
    await expect(invoke(getTodayMoodEntry)).resolves.toEqual({
      id: "mood-1",
      value: 0,
      createdAt: createdAt.toISOString(),
    });

    vi.mocked(prisma.moodEntry.findFirst).mockResolvedValueOnce(null);
    await expect(invoke(getTodayMoodEntry)).rejects.toThrow(
      "No mood entry for today",
    );
  });

  it("creates online entries and idempotently upserts offline entries", async () => {
    vi.mocked(prisma.moodEntry.create).mockResolvedValueOnce({
      id: "online",
      value: 0,
      createdAt,
    } as never);
    await expect(
      invoke(saveMoodEntry, {
        value: 0,
        note: "stable",
        energy: 1,
        anxiety: 1,
        sleepHours: 0,
      }),
    ).resolves.toEqual({
      id: "online",
      value: 0,
      createdAt: createdAt.toISOString(),
    });

    vi.mocked(prisma.moodEntry.upsert).mockResolvedValueOnce({
      id: "offline",
      value: 7,
      createdAt,
    } as never);
    await invoke(saveMoodEntry, {
      operationId: "operation-1",
      recordedAt: "2026-08-10T08:00:00.000Z",
      value: 7,
      sleepQuality: "good",
      sleepDisturbances: ["nightmares"],
      tags: ["work"],
      sideEffects: ["fatigue"],
    });
    expect(prisma.moodEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_clientOperationId: {
            userId: user.id,
            clientOperationId: "operation-1",
          },
        },
        update: {},
      }),
    );
  });

  it("rejects an offline timestamp too far in the future", async () => {
    await expect(
      invoke(saveMoodEntry, {
        value: 5,
        recordedAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }),
    ).rejects.toThrow("cannot be in the future");
    expect(prisma.moodEntry.create).not.toHaveBeenCalled();
  });
});

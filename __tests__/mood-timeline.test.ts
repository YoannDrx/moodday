import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  countMoodTimeline,
  getCheckInInstant,
  listJournalActivityDates,
  listMoodTimeline,
} from "@/features/insights/mood-timeline";

const range = {
  userId: "timeline-user",
  startDate: "2026-08-01",
  endDate: "2026-08-07",
  start: new Date("2026-07-31T22:00:00.000Z"),
  endExclusive: new Date("2026-08-07T22:00:00.000Z"),
  timezone: "Europe/Paris",
};

beforeEach(() => {
  vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([]);
  vi.mocked(prisma.checkIn.findMany).mockResolvedValue([]);
});

describe("mood timeline", () => {
  it("keeps the real time of a check-in saved on the day it describes", () => {
    const createdAt = new Date("2026-08-03T19:30:00.000Z");
    expect(
      getCheckInInstant({ localDate: "2026-08-03", createdAt }, "Europe/Paris"),
    ).toBe(createdAt);
  });

  it("places a check-in synced on a later day at midday of the day it describes", () => {
    const instant = getCheckInInstant(
      {
        localDate: "2026-08-03",
        createdAt: new Date("2026-08-06T08:00:00.000Z"),
      },
      "Europe/Paris",
    );
    expect(instant.toISOString()).toBe("2026-08-03T10:00:00.000Z");
  });

  it("merges scored check-ins with journal entries in time order", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      {
        id: "mood-1",
        value: 4,
        energy: 5,
        anxiety: 6,
        sleepHours: 7.5,
        sleepQuality: "good",
        note: "journal",
        createdAt: new Date("2026-08-04T09:00:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([
      {
        id: "check-in-1",
        localDate: "2026-08-02",
        valence: 7,
        activation: 3,
        anxiety: null,
        note: "check-in",
        createdAt: new Date("2026-08-02T18:00:00.000Z"),
      },
    ] as never);

    const entries = await listMoodTimeline(range);

    expect(entries).toEqual([
      {
        id: "check-in-1",
        source: "check_in",
        value: 7,
        energy: 3,
        anxiety: null,
        sleepHours: null,
        sleepQuality: null,
        note: "check-in",
        date: new Date("2026-08-02T18:00:00.000Z"),
      },
      expect.objectContaining({ id: "mood-1", source: "mood_entry", value: 4 }),
    ]);
    expect(prisma.checkIn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "timeline-user",
          localDate: { gte: "2026-08-01", lte: "2026-08-07" },
          valence: { not: null },
        },
      }),
    );
    expect(prisma.moodEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "timeline-user",
          createdAt: { gte: range.start, lt: range.endExclusive },
        },
      }),
    );
  });

  it("counts presence-only check-ins as activity but not as scored entries", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      { createdAt: new Date("2026-08-01T08:00:00.000Z") },
    ] as never);
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([
      {
        localDate: "2026-08-02",
        createdAt: new Date("2026-08-02T08:00:00.000Z"),
      },
    ] as never);

    await expect(listJournalActivityDates(range)).resolves.toEqual([
      new Date("2026-08-01T08:00:00.000Z"),
      new Date("2026-08-02T08:00:00.000Z"),
    ]);
    expect(prisma.checkIn.findMany).toHaveBeenCalledWith({
      where: {
        userId: "timeline-user",
        localDate: { gte: "2026-08-01", lte: "2026-08-07" },
      },
      select: { localDate: true, createdAt: true },
    });

    vi.mocked(prisma.moodEntry.count).mockResolvedValue(2);
    vi.mocked(prisma.checkIn.count).mockResolvedValue(3);
    await expect(countMoodTimeline(range)).resolves.toBe(5);
    expect(prisma.checkIn.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ valence: { not: null } }),
    });
  });

  it("reads through the given transaction client", async () => {
    const client = {
      moodEntry: { findMany: vi.fn().mockResolvedValue([]) },
      checkIn: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await listMoodTimeline({ ...range, client: client as never });
    expect(client.checkIn.findMany).toHaveBeenCalledOnce();
    expect(prisma.checkIn.findMany).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { readMoodRange } from "@/features/insights/mood-read-model";
vi.mock("server-only", () => ({}));

const input = {
  userId: "owner",
  startDate: "2026-10-25",
  endDate: "2026-10-25",
  timezone: "Europe/Paris",
};
const checkIn = {
  id: "offline",
  depth: "quick",
  localDate: "2026-10-25",
  valence: 0,
  activation: 2,
  anxiety: null,
  irritability: 1,
  createdAt: new Date("2026-11-01T10:00:00Z"),
};

describe("shared mood read model", () => {
  beforeEach(() => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([]);
  });

  it("uses the declared civil date across offline import and DST, with zero preserved", async () => {
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([checkIn] as never);
    const result = await readMoodRange(input);
    expect(result.entries).toEqual([
      expect.objectContaining({
        id: "check-in:offline",
        value: 0,
        energy: 2,
        sleepHours: null,
        note: null,
        source: "check-in",
        timePrecision: "day",
        localDate: "2026-10-25",
        createdAt: new Date("2026-10-24T22:00:00Z"),
      }),
    ]);
    expect(prisma.checkIn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "owner",
          localDate: { gte: input.startDate, lte: input.endDate },
        },
      }),
    );
    const select = vi.mocked(prisma.checkIn.findMany).mock.calls[0][0]?.select;
    expect(select).not.toHaveProperty("note");
    expect(select).not.toHaveProperty("operationId");
  });

  it("counts presence without inventing scores, including malformed old presence scores", async () => {
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([
      { ...checkIn, depth: "presence", valence: null },
      { ...checkIn, id: "presence-with-score", depth: "presence", valence: 5 },
    ] as never);
    expect(await readMoodRange(input)).toEqual({
      entries: [],
      recordedDates: ["2026-10-25"],
    });
  });

  it("keeps independent journal/check-in events and sorts them without duplicate writes", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      {
        id: "journal-1",
        value: 6,
        energy: null,
        anxiety: 0,
        sleepHours: 7,
        sleepQuality: "good",
        note: "Owner's journal note",
        createdAt: new Date("2026-10-25T12:00:00Z"),
      },
    ] as never);
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([checkIn] as never);
    const result = await readMoodRange(input);
    expect(result.entries.map((entry) => entry.source)).toEqual([
      "check-in",
      "journal",
    ]);
    expect(result.recordedDates).toEqual(["2026-10-25"]);
    expect(prisma.moodEntry.create).not.toHaveBeenCalled();
    expect(prisma.checkIn.create).not.toHaveBeenCalled();
  });

  it("preserves the selected civil day in extreme timezones", async () => {
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([checkIn] as never);
    const result = await readMoodRange({
      ...input,
      timezone: "Pacific/Kiritimati",
    });
    expect(result.entries[0].createdAt.toISOString()).toBe(
      "2026-10-24T10:00:00.000Z",
    );
    expect(result.entries[0].localDate).toBe(input.startDate);
  });
});

import { calculateMoodStreak } from "@/features/insights/streak";
import { describe, expect, it } from "vitest";

describe("mood streak civil dates", () => {
  it("counts consecutive Paris days across the spring DST transition", () => {
    const result = calculateMoodStreak({
      entryDates: [
        new Date("2026-03-29T21:30:00.000Z"),
        new Date("2026-03-29T22:30:00.000Z"),
      ],
      todayDate: "2026-03-30",
      timeZone: "Europe/Paris",
    });

    expect(result.streakDays).toBe(2);
    expect(result.hasEntryToday).toBe(true);
    expect(result.weekProgress).toEqual([0, 0, 0, 0, 0, 1, 1]);
  });

  it("does not accidentally group days using UTC", () => {
    const result = calculateMoodStreak({
      entryDates: [
        new Date("2026-03-29T21:30:00.000Z"),
        new Date("2026-03-29T22:30:00.000Z"),
      ],
      todayDate: "2026-03-30",
      timeZone: "UTC",
    });

    expect(result.streakDays).toBe(1);
    expect(result.hasEntryToday).toBe(false);
  });

  it("starts from yesterday when today has no entry and respects its cap", () => {
    const result = calculateMoodStreak({
      entryDates: [
        new Date("2025-12-31T20:00:00.000Z"),
        new Date("2026-01-01T20:00:00.000Z"),
      ],
      todayDate: "2026-01-03",
      timeZone: "Pacific/Kiritimati",
      maximumDays: 1,
    });

    expect(result.streakDays).toBe(1);
    expect(result.hasEntryToday).toBe(false);
  });
});

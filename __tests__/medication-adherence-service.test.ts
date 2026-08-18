import { getMedicationAdherenceForUser } from "@/features/medication/adherence-service";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getMedicationAdherenceForUser", () => {
  afterEach(() => vi.useRealTimers());

  it("queries the effective schedules and legacy intakes in the user's civil range", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T12:00:00.000Z"));
    const medication = {
      id: "medication-1",
      frequency: "daily",
      isPRN: false,
      startDate: "2026-03-28",
      endDate: null,
      weeklyDay: null,
      scheduleTimes: ["09:00"],
      scheduleRevisions: [],
      intakes: [
        {
          scheduledForDate: "2026-03-29",
          doseIndex: 0,
          skipped: false,
        },
      ],
    };
    const client = {
      medication: { findMany: vi.fn(async () => [medication]) },
    };

    const result = await getMedicationAdherenceForUser({
      userId: "user-1",
      startDate: "2026-03-29",
      endDate: "2026-03-29",
      timezone: "Europe/Paris",
      client: client as never,
    });

    expect(result).toEqual({ expectedDoses: 1, takenDoses: 1, percent: 100 });
    expect(client.medication.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", frequency: { not: "prn" } },
      include: {
        intakes: {
          where: {
            OR: [
              {
                scheduledForDate: {
                  gte: "2026-03-29",
                  lte: "2026-03-29",
                },
              },
              {
                scheduledForDate: null,
                takenAt: {
                  gte: new Date("2026-03-28T23:00:00.000Z"),
                  lt: new Date("2026-03-29T22:00:00.000Z"),
                },
              },
            ],
          },
        },
        scheduleRevisions: {
          where: { effectiveDate: { lte: "2026-03-29" } },
          orderBy: { effectiveDate: "asc" },
        },
      },
    });
  });
});

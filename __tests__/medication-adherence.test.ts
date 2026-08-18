import {
  calculateAdherencePercent,
  calculateMedicationAdherence,
  getExpectedDosesForFrequency,
  getInclusiveDayCount,
} from "@/features/medication/adherence";
import { describe, expect, it } from "vitest";

describe("medication adherence", () => {
  it("counts expected doses by frequency", () => {
    expect(getExpectedDosesForFrequency("daily", 7)).toBe(7);
    expect(getExpectedDosesForFrequency("twice_daily", 7)).toBe(14);
    expect(getExpectedDosesForFrequency("weekly", 30)).toBe(5);
    expect(getExpectedDosesForFrequency("prn", 30)).toBe(0);
    expect(getExpectedDosesForFrequency("daily", 0)).toBe(0);
    expect(getExpectedDosesForFrequency("custom", 3)).toBe(3);
  });

  it("uses the active period and excludes future doses", () => {
    const result = calculateMedicationAdherence({
      startDate: "2026-03-20",
      endDate: "2026-03-31",
      todayDate: "2026-03-25",
      medications: [
        {
          id: "med-1",
          frequency: "daily",
          isPRN: false,
          startDate: "2026-03-23",
          endDate: null,
          weeklyDay: null,
          scheduleTimes: ["09:00"],
          scheduleRevisions: [],
          intakes: [
            {
              scheduledForDate: "2026-03-23",
              doseIndex: 0,
              skipped: false,
            },
            {
              scheduledForDate: "2026-03-24",
              doseIndex: 0,
              skipped: true,
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      expectedDoses: 3,
      takenDoses: 1,
      percent: 33,
    });
  });

  it("applies schedule revisions without changing past expectations", () => {
    const result = calculateMedicationAdherence({
      startDate: "2026-01-01",
      endDate: "2026-01-04",
      todayDate: "2026-01-04",
      medications: [
        {
          id: "med-1",
          frequency: "daily",
          isPRN: false,
          startDate: "2026-01-01",
          endDate: null,
          weeklyDay: null,
          scheduleTimes: ["09:00"],
          scheduleRevisions: [
            {
              effectiveDate: "2026-01-03",
              frequency: "twice_daily",
              weeklyDay: null,
              scheduleTimes: ["09:00", "20:00"],
            },
          ],
          intakes: [
            { scheduledForDate: "2026-01-01", doseIndex: 0, skipped: false },
            { scheduledForDate: "2026-01-02", doseIndex: 0, skipped: false },
            { scheduledForDate: "2026-01-03", doseIndex: 0, skipped: false },
            { scheduledForDate: "2026-01-03", doseIndex: 1, skipped: false },
          ],
        },
      ],
    });

    expect(result.expectedDoses).toBe(6);
    expect(result.takenDoses).toBe(4);
    expect(result.percent).toBe(67);
  });

  it("counts exact weekly days and excludes PRN", () => {
    const result = calculateMedicationAdherence({
      startDate: "2026-10-24",
      endDate: "2026-11-02",
      todayDate: "2026-11-02",
      medications: [
        {
          id: "weekly",
          frequency: "weekly",
          startDate: "2026-10-24",
          endDate: null,
          weeklyDay: 0,
          scheduleTimes: ["09:00"],
          scheduleRevisions: [],
          intakes: [
            { scheduledForDate: "2026-10-25", doseIndex: 0, skipped: false },
          ],
        },
        {
          id: "prn",
          frequency: "prn",
          isPRN: true,
          startDate: "2026-10-24",
          endDate: null,
          weeklyDay: null,
          scheduleTimes: [],
          scheduleRevisions: [],
          intakes: [
            { scheduledForDate: null, doseIndex: null, skipped: false },
          ],
        },
      ],
    });

    expect(result).toEqual({
      expectedDoses: 2,
      takenDoses: 1,
      percent: 50,
    });
  });

  it("returns null when the period has no expected dose", () => {
    expect(
      calculateMedicationAdherence({
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        todayDate: "2026-01-02",
        medications: [],
      }).percent,
    ).toBeNull();
  });

  it("returns null when the requested range is entirely in the future", () => {
    expect(
      calculateMedicationAdherence({
        startDate: "2026-08-14",
        endDate: "2026-08-20",
        todayDate: "2026-08-13",
        medications: [],
      }),
    ).toEqual({ expectedDoses: 0, takenDoses: 0, percent: null });
  });

  it("intersects medication end dates and ignores treatments outside the range", () => {
    const result = calculateMedicationAdherence({
      startDate: "2026-02-01",
      endDate: "2026-02-10",
      todayDate: "2026-02-20",
      medications: [
        {
          id: "ended",
          frequency: "daily",
          startDate: "2026-02-01",
          endDate: "2026-02-03",
          weeklyDay: null,
          scheduleTimes: ["09:00"],
          scheduleRevisions: [],
          intakes: [
            { scheduledForDate: "2026-02-01", doseIndex: null, skipped: false },
            { scheduledForDate: null, doseIndex: 0, skipped: false },
          ],
        },
        {
          id: "future",
          frequency: "daily",
          startDate: "2026-03-01",
          endDate: null,
          weeklyDay: null,
          scheduleTimes: ["09:00"],
          scheduleRevisions: [],
          intakes: [],
        },
      ],
    });

    expect(result).toEqual({ expectedDoses: 3, takenDoses: 1, percent: 33 });
  });

  it("supports a PRN schedule revision without adding expected doses", () => {
    const result = calculateMedicationAdherence({
      startDate: "2026-04-01",
      endDate: "2026-04-02",
      todayDate: "2026-04-03",
      medications: [
        {
          id: "became-prn",
          frequency: "daily",
          startDate: null,
          endDate: null,
          weeklyDay: null,
          scheduleTimes: ["09:00"],
          scheduleRevisions: [
            {
              effectiveDate: "2026-04-01",
              frequency: "prn",
              weeklyDay: null,
              scheduleTimes: [],
            },
          ],
          intakes: [],
        },
      ],
    });

    expect(result).toEqual({ expectedDoses: 0, takenDoses: 0, percent: null });
  });

  it("calculates adherence across mixed regular medication frequencies", () => {
    const adherence = calculateAdherencePercent(
      [
        { frequency: "daily", intakes: Array.from({ length: 7 }) },
        { frequency: "twice_daily", intakes: Array.from({ length: 10 }) },
        { frequency: "weekly", intakes: Array.from({ length: 1 }) },
      ],
      7,
    );

    expect(adherence).toBe(82);
  });

  it("returns null when there are no expected regular doses", () => {
    expect(
      calculateAdherencePercent([{ frequency: "prn", intakes: [] }], 7),
    ).toBeNull();
  });

  it("caps legacy adherence at one hundred percent", () => {
    expect(
      calculateAdherencePercent(
        [{ frequency: "daily", intakes: Array.from({ length: 4 }) }],
        1,
      ),
    ).toBe(100);
  });

  it("counts date ranges inclusively", () => {
    expect(
      getInclusiveDayCount(
        new Date("2026-05-15T00:00:00.000+02:00"),
        new Date("2026-05-15T23:59:59.999+02:00"),
      ),
    ).toBe(1);

    expect(
      getInclusiveDayCount(
        new Date("2026-05-01T00:00:00.000+02:00"),
        new Date("2026-05-30T23:59:59.999+02:00"),
      ),
    ).toBe(30);
    expect(
      getInclusiveDayCount(
        new Date("2026-05-30T00:00:00.000+02:00"),
        new Date("2026-05-01T00:00:00.000+02:00"),
      ),
    ).toBe(0);
  });
});

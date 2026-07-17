import {
  calculateAdherencePercent,
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

  it("counts date ranges inclusively", () => {
    expect(
      getInclusiveDayCount(
        new Date(2026, 4, 15, 0, 0, 0, 0),
        new Date(2026, 4, 15, 23, 59, 59, 999),
      ),
    ).toBe(1);

    expect(
      getInclusiveDayCount(
        new Date(2026, 4, 1, 0, 0, 0, 0),
        new Date(2026, 4, 30, 23, 59, 59, 999),
      ),
    ).toBe(30);
  });
});

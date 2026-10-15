import { describe, expect, it } from "vitest";
import { calculateDailyAssociation } from "@/features/insights/daily-association";

describe("daily associations", () => {
  const pairs = Array.from({ length: 5 }, (_, index) => ({
    localDate: `2026-09-0${index + 1}`,
    x: index,
    y: 10 - index,
  }));
  it("preserves negative direction and zero-valued observations", () => {
    expect(calculateDailyAssociation(pairs, 7)).toMatchObject({
      comparableDays: 5,
      association: { direction: "negative", coefficient: -1 },
    });
  });
  it("does not count repeated submissions as independent days", () => {
    expect(
      calculateDailyAssociation(
        pairs.map((pair) => ({ ...pair, localDate: "2026-09-01" })),
        7,
      ),
    ).toMatchObject({ comparableDays: 1, association: null });
  });
  it("requires sufficient period coverage even with five paired days", () => {
    expect(calculateDailyAssociation(pairs, 30)).toMatchObject({
      comparableDays: 5,
      association: null,
    });
  });
  it("does not replace absent values with zeros", () => {
    expect(
      calculateDailyAssociation(
        [...pairs, { localDate: "2026-09-06", x: 2, y: null }],
        7,
      ).comparableDays,
    ).toBe(5);
  });
});

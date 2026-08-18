import { normalizeTherapyCivilDate } from "@/features/therapy/therapy-date";
import { describe, expect, it } from "vitest";

describe("therapy civil date", () => {
  it("stores a Paris civil day at its exact UTC midnight", () => {
    expect(normalizeTherapyCivilDate("2026-07-16", "Europe/Paris")).toEqual({
      dateKey: "2026-07-16",
      date: new Date("2026-07-15T22:00:00.000Z"),
      timezone: "Europe/Paris",
    });
  });

  it("normalizes a legacy instant using the user's timezone", () => {
    expect(
      normalizeTherapyCivilDate("2026-07-15T22:30:00.000Z", "Europe/Paris")
        .dateKey,
    ).toBe("2026-07-16");
  });

  it("rejects an impossible civil date", () => {
    expect(() =>
      normalizeTherapyCivilDate("2026-02-30", "Europe/Paris"),
    ).toThrow("Invalid civil date key");
  });
});

import { getExportDateRange } from "@/features/export/date-range";
import { describe, expect, it } from "vitest";

describe("export date range", () => {
  it("converts inclusive summer dates from the user time zone to UTC", () => {
    const range = getExportDateRange({
      startDate: "2026-07-16",
      endDate: "2026-07-16",
      timezone: "Europe/Paris",
    });

    expect(range).toEqual({
      start: new Date("2026-07-15T22:00:00.000Z"),
      endExclusive: new Date("2026-07-16T22:00:00.000Z"),
      timezone: "Europe/Paris",
    });
  });

  it("uses a 23-hour UTC interval across the spring DST transition", () => {
    const range = getExportDateRange({
      startDate: "2026-03-29",
      endDate: "2026-03-29",
      timezone: "Europe/Paris",
    });

    expect(range.start.toISOString()).toBe("2026-03-28T23:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("falls back to the France launch timezone for an invalid stored zone", () => {
    const range = getExportDateRange({
      startDate: "2026-01-10",
      endDate: "2026-01-11",
      timezone: "Invalid/Timezone",
    });

    expect(range.timezone).toBe("Europe/Paris");
    expect(range.start.toISOString()).toBe("2026-01-09T23:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-01-11T23:00:00.000Z");
  });
});

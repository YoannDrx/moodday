import {
  addCivilDays,
  getCivilDayRange,
  getCivilDateRangeDayCount,
  getDateKeyForTimeZone,
  enumerateCivilDateKeys,
  getCivilWeekday,
  getSafeTimeZone,
  parseCivilDateKey,
} from "@/lib/temporal/civil-date";
import { describe, expect, it } from "vitest";

describe("civil date service", () => {
  it("enumerates dates over the Europe/Paris spring DST boundary", () => {
    expect(enumerateCivilDateKeys("2026-03-27", "2026-03-31")).toEqual([
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
      "2026-03-30",
      "2026-03-31",
    ]);
  });

  it("enumerates dates over the Europe/Paris autumn DST boundary", () => {
    expect(enumerateCivilDateKeys("2026-10-24", "2026-10-27")).toEqual([
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
  });

  it("crosses years and determines weekdays independently of host timezone", () => {
    expect(addCivilDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(getCivilWeekday("2026-10-25")).toBe(0);
  });

  it("rejects impossible dates", () => {
    expect(() => parseCivilDateKey("2026-02-30")).toThrow();
  });

  it("maps one instant to the user's civil day in extreme timezones", () => {
    const instant = new Date("2026-01-01T08:30:00.000Z");
    expect(getDateKeyForTimeZone(instant, "UTC")).toBe("2026-01-01");
    expect(getDateKeyForTimeZone(instant, "Pacific/Kiritimati")).toBe(
      "2026-01-01",
    );
    expect(getDateKeyForTimeZone(instant, "America/Adak")).toBe("2025-12-31");
  });

  it("produces exact 23-hour and 25-hour Paris civil-day bounds", () => {
    const spring = getCivilDayRange("2026-03-29", "Europe/Paris");
    const autumn = getCivilDayRange("2026-10-25", "Europe/Paris");

    expect(spring.endExclusive.getTime() - spring.start.getTime()).toBe(
      23 * 60 * 60 * 1_000,
    );
    expect(autumn.endExclusive.getTime() - autumn.start.getTime()).toBe(
      25 * 60 * 60 * 1_000,
    );
  });

  it("uses an explicit deterministic fallback for absent or invalid zones", () => {
    expect(getSafeTimeZone()).toBe("Europe/Paris");
    expect(getSafeTimeZone("Invalid/Zone")).toBe("Europe/Paris");
    expect(getSafeTimeZone(undefined, "UTC")).toBe("UTC");
  });

  it("counts inclusive civil windows without allowing an accidental 366th day", () => {
    expect(getCivilDateRangeDayCount("2026-01-01", "2026-12-31")).toBe(365);
    expect(getCivilDateRangeDayCount("2026-01-01", "2027-01-01")).toBe(366);
    expect(getCivilDateRangeDayCount("2026-01-02", "2026-01-01")).toBe(0);
  });
});

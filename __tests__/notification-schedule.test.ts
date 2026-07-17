import {
  getLocalTime,
  getSafeTimeZone,
  isReminderDue,
} from "@/features/notifications/schedule";
import { describe, expect, it } from "vitest";

describe("notification schedule", () => {
  it("uses UTC when a stored time zone is missing or invalid", () => {
    expect(getSafeTimeZone(null)).toBe("UTC");
    expect(getSafeTimeZone("Not/A-Timezone")).toBe("UTC");
    expect(getSafeTimeZone("Europe/Paris")).toBe("Europe/Paris");
  });

  it("uses a bounded fifteen-minute reminder window", () => {
    expect(isReminderDue("09:00", "09:00")).toBe(true);
    expect(isReminderDue("09:14", "09:00")).toBe(true);
    expect(isReminderDue("08:59", "09:00")).toBe(false);
    expect(isReminderDue("09:15", "09:00")).toBe(false);
    expect(isReminderDue("invalid", "09:00")).toBe(false);
  });

  it("computes local clock time across the Europe/Paris DST jump", () => {
    expect(
      getLocalTime(new Date("2026-03-29T00:55:00.000Z"), "Europe/Paris"),
    ).toBe("01:55");
    expect(
      getLocalTime(new Date("2026-03-29T01:05:00.000Z"), "Europe/Paris"),
    ).toBe("03:05");
  });

  it("does not roll a late reminder into the next local day", () => {
    expect(isReminderDue("00:05", "23:55")).toBe(false);
  });
});

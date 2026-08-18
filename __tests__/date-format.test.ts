import { describe, expect, it } from "vitest";

import { formatDate } from "@/lib/format/date";

describe("localized date formatting", () => {
  const date = new Date(2026, 7, 13, 12, 0, 0);

  it("uses French as the product default", () => {
    expect(formatDate(date)).toBe("août 13, 2026");
  });

  it("formats the same civil date in English on explicit preference", () => {
    expect(formatDate(date, "en")).toBe("August 13, 2026");
  });
});

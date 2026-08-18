import {
  parseMooddayCsvImport,
  parseMooddayJsonImport,
} from "@/features/import/moodday-import";
import { describe, expect, it } from "vitest";

describe("Moodday imports", () => {
  it("validates versioned JSON and creates stable idempotency keys", () => {
    const content = JSON.stringify({
      format: "moodday",
      version: 2,
      moodEntries: [
        {
          date: "2026-08-12T08:00:00.000Z",
          value: 0,
          note: "Une note",
          tags: ["travail"],
        },
      ],
    });
    const first = parseMooddayJsonImport(content);
    const second = parseMooddayJsonImport(content);
    expect(first.rows[0].value).toBe(0);
    expect(first.rows[0].operationId).toBe(second.rows[0].operationId);
    expect(first.errors).toEqual([]);
  });

  it("reports invalid CSV rows without accepting them", () => {
    const preview = parseMooddayCsvImport(
      "date,value,note,tags\n2026-08-12T08:00:00.000Z,5,ok,travail|sommeil\ninvalid,42,bad,",
    );
    expect(preview.rows).toHaveLength(1);
    expect(preview.errors).toEqual([{ rowNumber: 3, code: "invalid_row" }]);
  });

  it("requires the documented CSV headers", () => {
    expect(() => parseMooddayCsvImport("note\nhello")).toThrow();
  });

  it("preserves zero values instead of treating them as missing", () => {
    const preview = parseMooddayCsvImport(
      "date,value,energy,anxiety\n2026-08-12T08:00:00.000Z,0,0,0",
    );
    expect(preview.rows[0]).toEqual(
      expect.objectContaining({ value: 0, energy: 0, anxiety: 0 }),
    );
  });
});

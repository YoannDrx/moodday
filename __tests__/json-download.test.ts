import { describe, expect, it } from "vitest";

import { createJsonDownloadStream } from "../src/features/account/json-download";

describe("JSON export stream", () => {
  it("produces valid JSON without serializing the whole document at once", async () => {
    const source = {
      exportMetadata: { dataVersion: "2.1" },
      moodEntries: Array.from({ length: 5_000 }, (_, index) => ({
        id: `mood-${index}`,
        note: index === 2_500 ? "Été, ligne 1\nligne 2" : null,
      })),
      caregiverCircle: { accessLog: [] },
    };

    const serialized = await new Response(
      createJsonDownloadStream(source),
    ).text();

    expect(JSON.parse(serialized)).toEqual(source);
    expect(serialized).toContain("Été, ligne 1\\nligne 2");
  });
});

it("preserves Unicode across chunks, dates and nulls and closes a cancelled generator", async () => {
  let finalized = false;
  async function* rows() {
    try {
      yield {
        note: "x".repeat(16370) + "🧪".repeat(100),
        date: new Date("2026-10-02T00:00:00Z"),
        absent: undefined,
        values: [null, undefined],
      };
      yield { note: "second" };
    } finally {
      finalized = true;
    }
  }
  const value = await new Response(
    createJsonDownloadStream({ rows: rows() }),
  ).json();
  expect(value.rows[0].note).toBe("x".repeat(16370) + "🧪".repeat(100));
  expect(value.rows[0]).toMatchObject({
    date: "2026-10-02T00:00:00.000Z",
    values: [null, null],
  });
  expect(value.rows[0]).not.toHaveProperty("absent");
  finalized = false;
  const reader = createJsonDownloadStream({ rows: rows() }).getReader();
  await reader.read();
  await reader.cancel();
  expect(finalized).toBe(true);
});

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

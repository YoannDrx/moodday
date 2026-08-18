import { describe, expect, it } from "vitest";
import { getOgImageFont } from "@/lib/og-image-font";

describe("Open Graph image fonts", () => {
  it("loads only the two fixed local font assets", async () => {
    const fonts = await getOgImageFont();

    expect(fonts).toHaveLength(2);
    expect(
      fonts.map(({ name, style, weight }) => ({ name, style, weight })),
    ).toEqual([
      { name: "Geist", style: "normal", weight: 400 },
      { name: "Geist", style: "normal", weight: 700 },
    ]);
    expect(fonts.every((font) => font.data.byteLength > 0)).toBe(true);
  });
});

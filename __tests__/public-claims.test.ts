import { describe, expect, it } from "vitest";

import { getActivePublicClaims } from "../src/lib/public-claims";

describe("public claims registry", () => {
  it("only exposes claims allowed on the requested surface", () => {
    const landing = getActivePublicClaims(
      "landing",
      new Date("2026-08-07T00:00:00.000Z"),
    );
    expect(landing.length).toBeGreaterThan(0);
    expect(
      landing.every((claim) => claim.allowedSurfaces.includes("landing")),
    ).toBe(true);
  });

  it("hides all expired claims", () => {
    expect(
      getActivePublicClaims("landing", new Date("2030-01-01T00:00:00.000Z")),
    ).toEqual([]);
  });
});

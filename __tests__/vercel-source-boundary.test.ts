import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel source boundary", () => {
  it("excludes every local environment file without a negated exception", () => {
    const patterns = fs
      .readFileSync(path.join(process.cwd(), ".vercelignore"), "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(patterns).toEqual(expect.arrayContaining([".env", ".env.*"]));
    expect(
      patterns.filter(
        (pattern) => pattern.startsWith("!") && pattern.includes(".env"),
      ),
    ).toEqual([]);
  });
});

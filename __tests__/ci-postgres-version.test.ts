import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowServiceCounts = new Map([
  [".github/workflows/code-quality.yml", 1],
  [".github/workflows/playwright.yml", 1],
  [".github/workflows/release-readiness.yml", 5],
]);

describe("CI PostgreSQL version", () => {
  it.each([...workflowServiceCounts])(
    "%s keeps every disposable database on PostgreSQL 17",
    (workflowPath, expectedServices) => {
      const workflow = fs.readFileSync(
        path.join(process.cwd(), workflowPath),
        "utf8",
      );
      const postgresImages = [...workflow.matchAll(/image: postgres:(\d+)/g)];

      expect(postgresImages).toHaveLength(expectedServices);
      expect(postgresImages.map((match) => match[1])).toEqual(
        Array.from({ length: expectedServices }, () => "17"),
      );
    },
  );
});

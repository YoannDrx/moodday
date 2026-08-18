import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const testDirectories = ["__tests__", "e2e"];
const ignoredTestPattern = /\b(?:test|it|describe)\.(?:skip|fixme)\s*\(/g;

function listTestFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listTestFiles(entryPath);
    }

    return /\.(?:c|m)?(?:j|t)sx?$/.test(entry.name) ? [entryPath] : [];
  });
}

describe("test suite policy", () => {
  it("rejects ignored unit and end-to-end scenarios", () => {
    const ignoredScenarios = testDirectories.flatMap((directory) =>
      listTestFiles(path.join(process.cwd(), directory)).flatMap((filePath) => {
        const source = fs.readFileSync(filePath, "utf8");

        return [...source.matchAll(ignoredTestPattern)].map((match) => ({
          file: path.relative(process.cwd(), filePath),
          line: source.slice(0, match.index).split("\n").length,
          expression: match[0].trim(),
        }));
      }),
    );

    expect(ignoredScenarios).toEqual([]);
  });

  it("keeps browser retries disabled and enforces release coverage in CI", () => {
    const playwrightConfig = fs.readFileSync(
      path.join(process.cwd(), "playwright.config.ts"),
      "utf8",
    );
    const qualityWorkflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/code-quality.yml"),
      "utf8",
    );

    expect(playwrightConfig).toMatch(/\bretries:\s*0\b/);
    expect(playwrightConfig).not.toMatch(/\bretries:\s*[1-9]\d*\b/);
    expect(qualityWorkflow).toContain("run: pnpm test:coverage:release");
    expect(qualityWorkflow).not.toContain("run: pnpm test:coverage\n");
  });

  it("runs PostgreSQL integrity proofs in the release workflow", () => {
    const releaseWorkflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/release-readiness.yml"),
      "utf8",
    );

    expect(releaseWorkflow).toContain("database-integrity:");
    expect(releaseWorkflow).toContain("run: pnpm verify:operational-jobs");
    expect(releaseWorkflow).toContain("run: pnpm verify:medication-integrity");
  });

  it("keeps the backup cleanup compatible with minimal PostgreSQL images", () => {
    const backupRestoreScript = fs.readFileSync(
      path.join(process.cwd(), "scripts/verify-backup-restore.ts"),
      "utf8",
    );

    expect(backupRestoreScript).toContain(
      'runPostgresTool(["rm", "-f", CONTAINER_DUMP_PATH])',
    );
    expect(backupRestoreScript).not.toContain(
      'runPostgresTool(["rm", "--force", CONTAINER_DUMP_PATH])',
    );
    expect(backupRestoreScript).toContain(
      'runPostgresTool(["stat", "-c", "%s", CONTAINER_DUMP_PATH]',
    );
    expect(backupRestoreScript).not.toContain('"--format=%s"');
  });
});

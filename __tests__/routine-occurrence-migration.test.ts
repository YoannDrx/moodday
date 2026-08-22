import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("routine occurrence daily uniqueness migration", () => {
  it("fails closed on historical duplicates before adding the constraint", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "prisma/migrations/20260822210000_v2_routine_occurrence_daily_uniqueness/migration.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("HAVING COUNT(*) > 1");
    expect(migration).toContain("RAISE EXCEPTION");
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "v2_routine_occurrence_routineId_localDate_key"',
    );
    expect(migration).not.toMatch(/DELETE FROM/iu);
  });

  it("upgrades the mobile SQLCipher queue before accepting occurrence writes", () => {
    const localDatabase = fs.readFileSync(
      path.join(process.cwd(), "apps/mobile/src/lib/local-database.ts"),
      "utf8",
    );

    expect(localDatabase).toContain("pending_sync_operation_v3");
    expect(localDatabase).toContain("'routine_occurrence'");
    expect(localDatabase).toContain("PRAGMA user_version = 3");
  });
});

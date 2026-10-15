import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("V2 synchronized drafts migration", () => {
  it("is additive and owner-cascaded", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "prisma/migrations/20260823170000_v2_synced_drafts_preferences/migration.sql",
      ),
      "utf8",
    );

    expect(migration).toContain('CREATE TABLE "v2_user_draft"');
    expect(migration).toContain('ALTER TABLE "user_preferences"');
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).toContain("v2_user_draft_kind_check");
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)/iu);
    expect(migration).not.toMatch(/DELETE\s+FROM/iu);
  });

  it("upgrades SQLCipher without discarding pending operations", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "apps/mobile/src/lib/local-database.ts"),
      "utf8",
    );
    expect(source).toContain("pending_sync_operation_v9");
    expect(source).toContain("mutable_sync_state");
    expect(source).toContain("PRAGMA user_version = 9");
    expect(source).toContain("unsynced_draft_must_be_resolved");
    expect(source).toContain("FROM pending_sync_operation");
  });
});

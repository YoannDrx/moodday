/* eslint-disable no-console -- standalone release verification emits a safe summary */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const SNAPSHOT_LAST_MIGRATION =
  "20260810120000_subscription_updated_at_no_default";
const EXPECTED_SNAPSHOT_MIGRATIONS = 12;
const EXPECTED_FINAL_MIGRATIONS = 27;
const EXPECTED_PUBLIC_TABLES = 64;

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DATABASE_URL_UNPOOLED;

const validateDisposableDatabase: (
  value: string | undefined,
  name: string,
) => asserts value is string = (value, name) => {
  assert.ok(value, `${name} is required`);
  const parsed = new URL(value);
  assert.ok(
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1",
    `${name} must target localhost`,
  );
  assert.match(
    parsed.pathname,
    /moodday_migration_upgrade/,
    `${name} database name must contain moodday_migration_upgrade`,
  );
};

validateDisposableDatabase(databaseUrl, "DATABASE_URL");
validateDisposableDatabase(directUrl, "DATABASE_URL_UNPOOLED");
assert.equal(
  process.env.MIGRATION_REHEARSAL_ACK,
  "local-disposable",
  "MIGRATION_REHEARSAL_ACK=local-disposable is required",
);

const runPrisma = (args: string[], options?: { capture?: boolean }) => {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_URL_UNPOOLED: directUrl,
    },
    encoding: "utf8",
    stdio: options?.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Prisma verification command failed (${args[0]})`);
  }
  return result.stdout;
};

const countRows = async (prisma: PrismaClient, sql: string) => {
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(sql);
  return Number(rows[0]?.count ?? 0);
};

const main = async () => {
  const prisma = new PrismaClient();
  const fixtureSuffix = randomUUID();
  const userId = `migration-user-${fixtureSuffix}`;
  const preferenceId = `migration-preference-${fixtureSuffix}`;
  const orphanPreferenceId = `migration-orphan-${fixtureSuffix}`;
  const medicationId = `migration-medication-${fixtureSuffix}`;

  try {
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = 'public'`,
      ),
      0,
      "Migration rehearsal database must be empty",
    );

    const migrationNames = (
      await readdir(path.join(process.cwd(), "prisma/migrations"), {
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const snapshotEnd = migrationNames.indexOf(SNAPSHOT_LAST_MIGRATION);
    assert.notEqual(snapshotEnd, -1, "Snapshot migration is missing");
    const snapshotMigrations = migrationNames.slice(0, snapshotEnd + 1);
    assert.equal(snapshotMigrations.length, EXPECTED_SNAPSHOT_MIGRATIONS);
    assert.equal(migrationNames.length, EXPECTED_FINAL_MIGRATIONS);

    for (const migrationName of snapshotMigrations) {
      runPrisma([
        "db",
        "execute",
        "--file",
        path.join("prisma/migrations", migrationName, "migration.sql"),
        "--url",
        directUrl,
      ]);
      runPrisma(["migrate", "resolve", "--applied", migrationName]);
    }
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count
         FROM "_prisma_migrations"
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
      ),
      EXPECTED_SNAPSHOT_MIGRATIONS,
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "user"
        ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, 'Migration fixture', $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      userId,
      `${fixtureSuffix}@migration.moodday.invalid`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "user_preferences"
        ("id", "userId", "updatedAt")
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      preferenceId,
      userId,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "user_preferences"
        ("id", "userId", "updatedAt")
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      orphanPreferenceId,
      `missing-user-${fixtureSuffix}`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "medication"
        ("id", "userId", "name", "dosage", "frequency", "updatedAt")
       VALUES ($1, $2, 'Migration fixture', 'fixture', 'daily', CURRENT_TIMESTAMP)`,
      medicationId,
      userId,
    );

    runPrisma(["migrate", "deploy"]);

    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count
         FROM "_prisma_migrations"
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
      ),
      EXPECTED_FINAL_MIGRATIONS,
    );
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = 'public'`,
      ),
      EXPECTED_PUBLIC_TABLES,
    );
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count FROM "user_preferences" WHERE "id" = '${preferenceId}'`,
      ),
      1,
    );
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count FROM "user_preferences" WHERE "id" = '${orphanPreferenceId}'`,
      ),
      0,
    );
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count FROM "user_consent" WHERE "userId" = '${userId}'`,
      ),
      0,
      "Existing users must not receive fabricated consent rows",
    );
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count
         FROM "user"
         WHERE "id" = '${userId}'
           AND "healthDataConsentVersionAccepted" IS NULL`,
      ),
      1,
      "Existing users must remain behind the health-data consent gate",
    );
    assert.equal(
      await countRows(
        prisma,
        `SELECT COUNT(*) AS count
         FROM "medication_schedule_revision"
         WHERE "medicationId" = '${medicationId}'`,
      ),
      1,
      "Existing medication must receive exactly one initial schedule revision",
    );

    const diff = runPrisma(
      [
        "migrate",
        "diff",
        "--exit-code",
        "--from-url",
        directUrl,
        "--to-schema-datamodel",
        "prisma/schema",
      ],
      { capture: true },
    );
    assert.match(diff, /No difference detected/i);

    console.log(
      JSON.stringify({
        ok: true,
        snapshotMigrations: EXPECTED_SNAPSHOT_MIGRATIONS,
        finalMigrations: EXPECTED_FINAL_MIGRATIONS,
        publicTables: EXPECTED_PUBLIC_TABLES,
        validPreferencePreserved: true,
        orphanPreferenceRemoved: true,
        existingConsentNotBackfilled: true,
        medicationRevisionBackfilled: true,
        schemaDrift: false,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
};

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Migration rehearsal failed",
  );
  process.exitCode = 1;
});

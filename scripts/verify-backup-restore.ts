/* eslint-disable no-console -- standalone release verification emits a safe summary */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const EXPECTED_PUBLIC_TABLES = 64;
const CONTAINER_DUMP_PATH = `/tmp/moodday-backup-restore-${process.pid}.dump`;

const sourceUrl = process.env.BACKUP_RESTORE_SOURCE_URL;
const destinationUrl = process.env.BACKUP_RESTORE_DESTINATION_URL;
const containerName = process.env.BACKUP_RESTORE_CONTAINER;

type DatabaseTarget = {
  url: string;
  database: string;
  username: string;
  password: string;
};

const parseDisposableTarget = (
  value: string | undefined,
  name: string,
  expectedDatabase: RegExp,
): DatabaseTarget => {
  assert.ok(value, `${name} is required`);
  const parsed = new URL(value);
  assert.ok(
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1",
    `${name} must target localhost`,
  );
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  assert.match(database, expectedDatabase, `${name} database name is unsafe`);
  assert.match(parsed.username, /^[a-zA-Z0-9_-]+$/, `${name} user is unsafe`);
  assert.ok(parsed.password, `${name} must include a password`);
  return {
    url: value,
    database,
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
};

const source = parseDisposableTarget(
  sourceUrl,
  "BACKUP_RESTORE_SOURCE_URL",
  /^moodday_backup_source(?:_[a-z0-9_]+)?$/,
);
const destination = parseDisposableTarget(
  destinationUrl,
  "BACKUP_RESTORE_DESTINATION_URL",
  /^moodday_backup_restore(?:_[a-z0-9_]+)?$/,
);

assert.notEqual(source.database, destination.database);
assert.equal(source.username, destination.username);
assert.equal(source.password, destination.password);
assert.equal(
  process.env.BACKUP_RESTORE_ACK,
  "local-disposable",
  "BACKUP_RESTORE_ACK=local-disposable is required",
);
assert.ok(containerName, "BACKUP_RESTORE_CONTAINER is required");
assert.match(
  containerName,
  /^(?:moodday-backup-restore[-a-z0-9]*|[a-f0-9]{12,64})$/,
  "BACKUP_RESTORE_CONTAINER must be a dedicated local name or CI container id",
);

const run = (
  command: string,
  args: string[],
  options?: {
    capture?: boolean;
    env?: Record<string, string | undefined>;
  },
) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...options?.env },
    encoding: "utf8",
    stdio: options?.capture ? "pipe" : "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} verification command failed`);
  }
  return typeof result.stdout === "string" ? result.stdout.trim() : "";
};

const runPostgresTool = (args: string[], options?: { capture?: boolean }) =>
  run(
    "docker",
    ["exec", "-e", `PGPASSWORD=${source.password}`, containerName, ...args],
    options,
  );

const runPrisma = (args: string[], databaseUrl: string, capture = false) =>
  run("pnpm", ["exec", "prisma", ...args], {
    capture,
    env: {
      DATABASE_URL: databaseUrl,
      DATABASE_URL_UNPOOLED: databaseUrl,
    },
  });

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

const getTableCounts = async (prisma: PrismaClient) => {
  const tables = await prisma.$queryRaw<
    { table_name: string }[]
  >`SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name`;
  const counts = await Promise.all(
    tables.map(async ({ table_name: tableName }) => {
      const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`,
      );
      return [tableName, Number(result[0]?.count ?? 0)] as const;
    }),
  );
  return new Map(counts);
};

const resetDatabase = (target: DatabaseTarget) => {
  runPostgresTool([
    "dropdb",
    "--if-exists",
    "--force",
    "--username",
    target.username,
    target.database,
  ]);
  runPostgresTool([
    "createdb",
    "--username",
    target.username,
    "--template",
    "template0",
    target.database,
  ]);
};

const dropDatabase = (target: DatabaseTarget) =>
  runPostgresTool([
    "dropdb",
    "--if-exists",
    "--force",
    "--username",
    target.username,
    target.database,
  ]);

const main = async () => {
  let sourceClient: PrismaClient | undefined;
  let destinationClient: PrismaClient | undefined;
  const fixtureId = `backup-restore-${randomUUID()}`;
  const fixtureCreatedAt = new Date();

  try {
    resetDatabase(source);
    resetDatabase(destination);
    runPrisma(["migrate", "deploy"], source.url);

    sourceClient = new PrismaClient({
      datasources: { db: { url: source.url } },
    });
    await sourceClient.user.create({
      data: {
        id: fixtureId,
        name: "Synthetic restore fixture",
        email: `${fixtureId}@restore.moodday.invalid`,
        emailVerified: true,
        createdAt: fixtureCreatedAt,
        updatedAt: fixtureCreatedAt,
        preferences: { create: { locale: "fr" } },
        moodEntries: {
          create: {
            value: 0,
            createdAt: fixtureCreatedAt,
            updatedAt: fixtureCreatedAt,
          },
        },
      },
    });

    const sourceCounts = await getTableCounts(sourceClient);
    assert.equal(sourceCounts.size, EXPECTED_PUBLIC_TABLES);
    const backupStartedAt = performance.now();
    runPostgresTool([
      "pg_dump",
      "--format=custom",
      "--no-owner",
      "--no-acl",
      "--username",
      source.username,
      "--file",
      CONTAINER_DUMP_PATH,
      source.database,
    ]);
    const backupDurationMs = Math.round(performance.now() - backupStartedAt);
    const backupBytes = Number(
      runPostgresTool(["stat", "-c", "%s", CONTAINER_DUMP_PATH], {
        capture: true,
      }),
    );
    assert.ok(backupBytes > 0, "Backup artifact must not be empty");

    const restoreStartedAt = performance.now();
    runPostgresTool([
      "pg_restore",
      "--exit-on-error",
      "--no-owner",
      "--no-acl",
      "--username",
      destination.username,
      "--dbname",
      destination.database,
      CONTAINER_DUMP_PATH,
    ]);
    const restoreDurationMs = Math.round(performance.now() - restoreStartedAt);

    destinationClient = new PrismaClient({
      datasources: { db: { url: destination.url } },
    });
    const destinationCounts = await getTableCounts(destinationClient);
    assert.deepEqual(destinationCounts, sourceCounts);
    const restoredFixture = await destinationClient.user.findUnique({
      where: { id: fixtureId },
      select: {
        emailVerified: true,
        preferences: { select: { locale: true } },
        moodEntries: { select: { value: true } },
      },
    });
    assert.deepEqual(restoredFixture, {
      emailVerified: true,
      preferences: { locale: "fr" },
      moodEntries: [{ value: 0 }],
    });

    const migrationStatus = runPrisma(
      ["migrate", "status"],
      destination.url,
      true,
    );
    assert.match(migrationStatus, /Database schema is up to date/i);
    const schemaDiff = runPrisma(
      [
        "migrate",
        "diff",
        "--exit-code",
        "--from-url",
        destination.url,
        "--to-schema-datamodel",
        "prisma/schema",
      ],
      destination.url,
      true,
    );
    assert.match(schemaDiff, /No difference detected/i);

    const observedRpoSeconds = Math.max(
      0,
      Math.ceil((Date.now() - fixtureCreatedAt.getTime()) / 1000),
    );
    console.log(
      JSON.stringify({
        ok: true,
        scope: "local-disposable",
        publicTablesCompared: sourceCounts.size,
        backupBytes,
        backupDurationMs,
        restoreDurationMs,
        observedRpoSeconds,
        rowCountsMatch: true,
        zeroValuePreserved: true,
        migrationHistoryRestored: true,
        schemaDrift: false,
      }),
    );
  } finally {
    await destinationClient?.$disconnect();
    await sourceClient?.$disconnect();
    runPostgresTool(["rm", "-f", CONTAINER_DUMP_PATH]);
    dropDatabase(destination);
    dropDatabase(source);
  }
};

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Backup/restore rehearsal failed",
  );
  process.exitCode = 1;
});

#!/usr/bin/env tsx
/* eslint-disable no-console */

import { spawnSync } from "node:child_process";

// Production once ran code whose Prisma schema was ahead of the database
// (P2022 on onboarding, medications and the notification cron). Refuse to
// build a Production deployment while a committed migration is missing from
// the target database. Migrations stay a deliberate, separate operation.
// `vercel-build` only calls this script for Vercel Production builds.
const result = spawnSync("pnpm", ["exec", "prisma", "migrate", "status"], {
  encoding: "utf8",
  env: process.env,
});

if (result.status === 0) {
  console.log("Migration guard passed: database schema is up to date");
  process.exit(0);
}

// Only print migration folder names. The full Prisma output names the
// database host, which does not belong in build logs.
const output = `${result.stdout}\n${result.stderr}`;
const pendingMigrations = output
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^\d{14}_[\w-]+$/.test(line));

console.error(
  "Migration guard failed: the Production database is not up to date.",
);
if (pendingMigrations.length > 0) {
  console.error(
    `Pending or failed migrations: ${pendingMigrations.join(", ")}`,
  );
} else {
  console.error(
    "prisma migrate status could not confirm the schema (connection or history error).",
  );
}
console.error(
  "Apply them with `pnpm prisma migrate deploy` against Production before deploying.",
);
process.exit(1);

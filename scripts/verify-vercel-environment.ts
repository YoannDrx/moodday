#!/usr/bin/env tsx
/* eslint-disable no-console */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "dotenv";
import {
  auditVercelDatabaseTopology,
  auditVercelEnvironmentEntries,
  auditVercelSensitiveValueIsolation,
  type VercelEnvironment,
  type VercelEnvironmentEntry,
} from "@/lib/operations/vercel-environment-audit";

const requestedEnvironment = process.argv
  .find((argument) => argument.startsWith("--environment="))
  ?.split("=")[1];

if (
  requestedEnvironment !== undefined &&
  requestedEnvironment !== "production" &&
  requestedEnvironment !== "preview"
) {
  throw new Error("--environment must be production or preview");
}

const environments: VercelEnvironment[] = requestedEnvironment
  ? [requestedEnvironment]
  : ["production", "preview"];

let failed = false;
const compareValues = process.argv.includes("--compare-values");

for (const environment of environments) {
  // Capture JSON in memory. Never print the provider response because legacy
  // plain variables may contain values even though this audit only uses names,
  // types and target scopes.
  const output = execFileSync(
    "vercel",
    ["env", "ls", environment, "--format", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(output) as { envs?: VercelEnvironmentEntry[] };
  const result = auditVercelEnvironmentEntries(parsed.envs ?? [], environment);

  console.log(
    `[${result.findings.length === 0 ? "OK" : "ERROR"}] Vercel ${environment}: ${result.configuredKeys} clés configurées`,
  );
  for (const finding of result.findings) {
    console.log(
      `  [${finding.severity.toUpperCase()}] ${finding.code}: ${finding.key}`,
    );
    if (finding.severity === "error") failed = true;
  }
}

function loadVercelEnvironmentValues(environment: VercelEnvironment) {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "moodday-vercel-env-audit-"),
  );
  fs.chmodSync(temporaryDirectory, 0o700);
  const destination = path.join(temporaryDirectory, `${environment}.env`);

  try {
    execFileSync(
      "vercel",
      ["env", "pull", destination, "--environment", environment, "--yes"],
      { stdio: ["ignore", "ignore", "ignore"] },
    );
    return parse(fs.readFileSync(destination));
  } catch {
    throw new Error(`Unable to inspect Vercel ${environment} values safely`);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (compareValues) {
  const productionValues = loadVercelEnvironmentValues("production");
  const previewValues = loadVercelEnvironmentValues("preview");
  const isolationFindings = auditVercelSensitiveValueIsolation(
    productionValues,
    previewValues,
  );
  const databaseFindings = [
    {
      environment: "production" as const,
      findings: auditVercelDatabaseTopology(productionValues),
    },
    {
      environment: "preview" as const,
      findings: auditVercelDatabaseTopology(previewValues),
    },
  ];
  const valueFindingCount =
    isolationFindings.length +
    databaseFindings.reduce(
      (total, result) => total + result.findings.length,
      0,
    );

  console.log(
    `[${valueFindingCount === 0 ? "OK" : "ERROR"}] Vercel value isolation and database topology`,
  );
  for (const finding of isolationFindings) {
    console.log(
      `  [${finding.severity.toUpperCase()}] ${finding.code}: ${finding.key}`,
    );
    if (finding.severity === "error") failed = true;
  }
  for (const result of databaseFindings) {
    for (const finding of result.findings) {
      console.log(
        `  [${finding.severity.toUpperCase()}] ${result.environment}:${finding.code}: ${finding.key}`,
      );
      if (finding.severity === "error") failed = true;
    }
  }
}

if (failed) process.exitCode = 1;

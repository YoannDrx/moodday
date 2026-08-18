#!/usr/bin/env tsx
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { auditCredentialRotationEvidence } from "@/lib/operations/credential-rotation-evidence";

const evidencePath = path.join(
  process.cwd(),
  "docs/operations/evidence/credential-rotation-2026-08-14.json",
);

if (!fs.existsSync(evidencePath)) {
  throw new Error("Credential rotation evidence registry is missing");
}

// The registry contains opaque evidence references only. Never print the raw
// document, because even a malformed future edit must not reach CI logs.
const result = auditCredentialRotationEvidence(
  JSON.parse(fs.readFileSync(evidencePath, "utf8")) as unknown,
);

if (!result.valid) {
  console.error("Credential rotation gate is not complete");
  for (const finding of result.findings) {
    console.error(`  [ERROR] ${finding.provider}: ${finding.code}`);
  }
  process.exitCode = 1;
} else {
  console.log("Credential rotation evidence verified");
}

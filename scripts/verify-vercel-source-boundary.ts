#!/usr/bin/env tsx
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignorePath = path.join(root, ".vercelignore");

if (!fs.existsSync(ignorePath)) {
  throw new Error(".vercelignore is required before any Vercel deployment");
}

const effectivePatterns = fs
  .readFileSync(ignorePath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

for (const requiredPattern of [".env", ".env.*"]) {
  if (!effectivePatterns.includes(requiredPattern)) {
    throw new Error(
      `.vercelignore must contain the exact ${requiredPattern} pattern`,
    );
  }
}

const unsafeNegations = effectivePatterns.filter(
  (pattern) => pattern.startsWith("!") && pattern.includes(".env"),
);
if (unsafeNegations.length > 0) {
  throw new Error(".vercelignore must not re-include any environment file");
}

console.log(
  "Vercel source boundary verified: local environment files are excluded",
);

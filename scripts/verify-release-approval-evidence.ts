#!/usr/bin/env tsx
/* eslint-disable no-console */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { auditReleaseApprovalEvidence } from "@/lib/operations/release-approval-evidence";

const evidencePath = path.join(
  process.cwd(),
  "docs/operations/evidence/release-approvals-2026-08.json",
);

if (!fs.existsSync(evidencePath)) {
  throw new Error("Release approval evidence registry is missing");
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8")) as unknown;
const preliminaryResult = auditReleaseApprovalEvidence(evidence);
let result = preliminaryResult;

if (preliminaryResult.valid) {
  const releaseCommit = process.env.RELEASE_CANDIDATE_COMMIT?.trim();
  if (!releaseCommit || !/^[0-9a-f]{40}$/.test(releaseCommit)) {
    console.error("Release approval gate is not complete");
    console.error("  [ERROR] document: release_candidate_commit_required");
    process.exitCode = 1;
  } else {
    const commitExists = spawnSync(
      "git",
      ["cat-file", "-e", `${releaseCommit}^{commit}`],
      { stdio: "ignore" },
    ).status;
    const isAncestor = spawnSync(
      "git",
      ["merge-base", "--is-ancestor", releaseCommit, "HEAD"],
      { stdio: "ignore" },
    ).status;
    const worktreeStatus = execFileSync(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      { encoding: "utf8" },
    ).trim();
    const changedPaths =
      commitExists === 0 && isAncestor === 0
        ? execFileSync("git", ["diff", "--name-only", releaseCommit, "HEAD"], {
            encoding: "utf8",
          })
            .split("\n")
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [];
    const allowedEvidencePaths = new Set([
      "docs/operations/evidence/credential-rotation-2026-08-14.json",
      "docs/operations/evidence/release-approvals-2026-08.json",
    ]);
    const unexpectedPaths = changedPaths.filter(
      (changedPath) => !allowedEvidencePaths.has(changedPath),
    );

    if (commitExists !== 0) {
      console.error("Release approval gate is not complete");
      console.error("  [ERROR] document: release_candidate_commit_unknown");
      process.exitCode = 1;
    } else if (isAncestor !== 0) {
      console.error("Release approval gate is not complete");
      console.error("  [ERROR] document: release_candidate_not_ancestor");
      process.exitCode = 1;
    } else if (worktreeStatus) {
      console.error("Release approval gate is not complete");
      console.error("  [ERROR] document: release_worktree_not_clean");
      process.exitCode = 1;
    } else if (unexpectedPaths.length > 0) {
      console.error("Release approval gate is not complete");
      console.error("  [ERROR] document: code_changed_after_approval");
      process.exitCode = 1;
    } else {
      result = auditReleaseApprovalEvidence(
        evidence,
        new Date(),
        releaseCommit,
      );
    }
  }
}

if (process.exitCode !== 1 && !result.valid) {
  console.error("Release approval gate is not complete");
  for (const finding of result.findings) {
    console.error(`  [ERROR] ${finding.requirement}: ${finding.code}`);
  }
  process.exitCode = 1;
} else if (process.exitCode !== 1) {
  console.log("Release approval evidence verified");
}

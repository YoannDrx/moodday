import { describe, expect, it } from "vitest";
import {
  auditReleaseApprovalEvidence,
  RELEASE_APPROVAL_REQUIREMENTS,
  type ReleaseApprovalEvidence,
} from "@/lib/operations/release-approval-evidence";

const releaseCommit = "a".repeat(40);
const completedEvidence = (): ReleaseApprovalEvidence => ({
  schemaVersion: 1,
  releaseScope: "moodday-fr-18-plus-2026-08",
  items: RELEASE_APPROVAL_REQUIREMENTS.map((requirement, index) => ({
    requirement,
    status: "approved",
    approvedAt: "2026-08-14T00:00:00+00:00",
    validUntil: null,
    evidenceReference: `approval-record:release-${index}`,
    approverReference: `approver_${index}`,
    releaseCommit,
  })),
});

describe("release approval evidence", () => {
  it("rejects a malformed registry without exposing schema input", () => {
    expect(auditReleaseApprovalEvidence({ schemaVersion: 2 })).toEqual({
      valid: false,
      findings: [{ requirement: "document", code: "invalid_document" }],
    });
  });

  it("accepts complete approvals linked to the release commit", () => {
    expect(
      auditReleaseApprovalEvidence(
        completedEvidence(),
        new Date("2026-08-15T00:00:00Z"),
      ),
    ).toEqual({ valid: true, findings: [] });
  });

  it("keeps pending approvals fail-closed", () => {
    const evidence = completedEvidence();
    evidence.items[0].status = "pending";

    expect(
      auditReleaseApprovalEvidence(evidence, new Date("2026-08-15T00:00:00Z"))
        .findings,
    ).toContainEqual({
      requirement: "data_controller",
      code: "approval_incomplete",
    });
  });

  it("rejects missing and duplicate requirements", () => {
    const evidence = completedEvidence();
    evidence.items = [evidence.items[0], ...evidence.items.slice(0, -1)];

    expect(
      auditReleaseApprovalEvidence(evidence, new Date("2026-08-15T00:00:00Z"))
        .findings,
    ).toEqual(
      expect.arrayContaining([
        { requirement: "data_controller", code: "duplicate_requirement" },
        { requirement: "go_no_go", code: "missing_requirement" },
      ]),
    );
  });

  it("requires every proof field for an approved item", () => {
    const evidence = completedEvidence();
    evidence.items[0] = {
      ...evidence.items[0],
      approvedAt: null,
      evidenceReference: null,
      approverReference: null,
      releaseCommit: null,
    };

    expect(
      auditReleaseApprovalEvidence(evidence, new Date("2026-08-15T00:00:00Z"))
        .findings,
    ).toEqual(
      expect.arrayContaining([
        { requirement: "data_controller", code: "missing_approval_date" },
        {
          requirement: "data_controller",
          code: "missing_evidence_reference",
        },
        {
          requirement: "data_controller",
          code: "missing_approver_reference",
        },
        { requirement: "data_controller", code: "missing_release_commit" },
      ]),
    );
  });

  it("rejects approvals dated in the future or already expired", () => {
    const evidence = completedEvidence();
    evidence.items[0].approvedAt = "2026-08-16T00:00:00+00:00";
    evidence.items[1].validUntil = "2026-08-14T23:59:59+00:00";

    expect(
      auditReleaseApprovalEvidence(evidence, new Date("2026-08-15T00:00:00Z"))
        .findings,
    ).toEqual(
      expect.arrayContaining([
        { requirement: "data_controller", code: "future_approval" },
        { requirement: "dpo", code: "expired_approval" },
      ]),
    );
  });

  it("requires every approval to target the same release commit", () => {
    const evidence = completedEvidence();
    evidence.items[0].releaseCommit = "b".repeat(40);

    expect(
      auditReleaseApprovalEvidence(evidence, new Date("2026-08-15T00:00:00Z"))
        .findings,
    ).toContainEqual({
      requirement: "document",
      code: "inconsistent_release_commit",
    });
  });

  it("rejects approvals linked to a different explicit candidate commit", () => {
    expect(
      auditReleaseApprovalEvidence(
        completedEvidence(),
        new Date("2026-08-15T00:00:00Z"),
        "b".repeat(40),
      ).findings,
    ).toContainEqual({
      requirement: "document",
      code: "candidate_commit_mismatch",
    });
  });
});

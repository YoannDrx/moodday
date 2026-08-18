import { describe, expect, it } from "vitest";
import {
  auditCredentialRotationEvidence,
  CREDENTIAL_ROTATION_REQUIREMENTS,
  type CredentialRotationEvidence,
} from "@/lib/operations/credential-rotation-evidence";

const completedEvidence = (): CredentialRotationEvidence => ({
  schemaVersion: 1,
  incidentId: "2026-08-14-vercel-preview-env-upload",
  items: CREDENTIAL_ROTATION_REQUIREMENTS.map(
    ({ provider, action }, index) => ({
      provider,
      action,
      status: "completed",
      oldCredentialDisabledAt: "2026-08-14T00:00:00+00:00",
      newCredentialProvisionedAt:
        action === "rotate" ? "2026-08-14T00:05:00+00:00" : null,
      activityReviewedAt: "2026-08-14T00:10:00+00:00",
      evidenceReference: `vault-record:rotation-${index}`,
      operatorReference: "operator_release_1",
    }),
  ),
});

describe("credential rotation evidence", () => {
  it("rejects a malformed registry without echoing schema details", () => {
    expect(auditCredentialRotationEvidence({ schemaVersion: 2 })).toEqual({
      valid: false,
      findings: [{ provider: "document", code: "invalid_document" }],
    });
  });

  it("accepts complete, dated and evidence-linked rotations", () => {
    expect(
      auditCredentialRotationEvidence(
        completedEvidence(),
        new Date("2026-08-15T00:00:00Z"),
      ),
    ).toEqual({ valid: true, findings: [] });
  });

  it("keeps every pending provider fail-closed", () => {
    const evidence = completedEvidence();
    evidence.items[0].status = "pending";

    expect(
      auditCredentialRotationEvidence(
        evidence,
        new Date("2026-08-15T00:00:00Z"),
      ).findings,
    ).toContainEqual({ provider: "neon", code: "rotation_incomplete" });
  });

  it("rejects missing and duplicate providers", () => {
    const evidence = completedEvidence();
    evidence.items = [evidence.items[0], ...evidence.items.slice(0, -1)];

    expect(
      auditCredentialRotationEvidence(
        evidence,
        new Date("2026-08-15T00:00:00Z"),
      ).findings,
    ).toEqual(
      expect.arrayContaining([
        { provider: "neon", code: "duplicate_provider" },
        { provider: "openai", code: "missing_provider" },
      ]),
    );
  });

  it("rejects an action mismatch and future evidence", () => {
    const evidence = completedEvidence();
    evidence.items[0].action = "revoke";
    evidence.items[1].activityReviewedAt = "2026-08-16T00:00:00+00:00";

    expect(
      auditCredentialRotationEvidence(
        evidence,
        new Date("2026-08-15T00:00:00Z"),
      ).findings,
    ).toEqual(
      expect.arrayContaining([
        { provider: "neon", code: "action_mismatch" },
        { provider: "github_oauth", code: "future_timestamp" },
      ]),
    );
  });

  it("requires every proof field for a completed rotation", () => {
    const evidence = completedEvidence();
    evidence.items[0] = {
      ...evidence.items[0],
      oldCredentialDisabledAt: null,
      newCredentialProvisionedAt: null,
      activityReviewedAt: null,
      evidenceReference: null,
      operatorReference: null,
    };

    expect(
      auditCredentialRotationEvidence(
        evidence,
        new Date("2026-08-15T00:00:00Z"),
      ).findings,
    ).toEqual(
      expect.arrayContaining([
        { provider: "neon", code: "missing_revocation" },
        { provider: "neon", code: "missing_new_credential" },
        { provider: "neon", code: "missing_activity_review" },
        { provider: "neon", code: "missing_evidence_reference" },
        { provider: "neon", code: "missing_operator_reference" },
      ]),
    );
  });
});

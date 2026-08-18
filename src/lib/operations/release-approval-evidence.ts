import { z } from "zod";

export const RELEASE_APPROVAL_REQUIREMENTS = [
  "data_controller",
  "dpo",
  "legal_bases",
  "health_consent",
  "legal_documents",
  "dpia",
  "hds",
  "processors",
  "retention",
  "incident_response",
  "clinical_safety",
  "openai_processing",
  "tax",
  "stripe_live",
  "vercel_production",
  "neon_production",
  "github_production",
  "resend_production",
  "credential_rotation",
  "accessibility",
  "go_no_go",
] as const;

const requirementSchema = z.enum(RELEASE_APPROVAL_REQUIREMENTS);
const timestampSchema = z.string().datetime({ offset: true });

export const releaseApprovalEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  releaseScope: z.literal("moodday-fr-18-plus-2026-08"),
  items: z.array(
    z.object({
      requirement: requirementSchema,
      status: z.enum(["pending", "approved"]),
      approvedAt: timestampSchema.nullable(),
      validUntil: timestampSchema.nullable(),
      evidenceReference: z
        .string()
        .min(3)
        .max(200)
        .regex(/^[a-z][a-z0-9-]*:[^\s]+$/i)
        .nullable(),
      approverReference: z
        .string()
        .min(3)
        .max(64)
        .regex(/^[a-z0-9][a-z0-9_-]+$/i)
        .nullable(),
      releaseCommit: z
        .string()
        .regex(/^[0-9a-f]{40}$/)
        .nullable(),
    }),
  ),
});

export type ReleaseApprovalEvidence = z.infer<
  typeof releaseApprovalEvidenceSchema
>;

export type ReleaseApprovalFinding = {
  requirement: string;
  code:
    | "invalid_document"
    | "missing_requirement"
    | "duplicate_requirement"
    | "approval_incomplete"
    | "missing_approval_date"
    | "missing_evidence_reference"
    | "missing_approver_reference"
    | "missing_release_commit"
    | "future_approval"
    | "expired_approval"
    | "inconsistent_release_commit"
    | "candidate_commit_mismatch";
};

export function auditReleaseApprovalEvidence(
  input: unknown,
  now = new Date(),
  expectedReleaseCommit?: string,
) {
  const parsed = releaseApprovalEvidenceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      findings: [
        { requirement: "document", code: "invalid_document" as const },
      ],
    };
  }

  const findings: ReleaseApprovalFinding[] = [];
  const itemsByRequirement = new Map<
    string,
    ReleaseApprovalEvidence["items"]
  >();

  for (const item of parsed.data.items) {
    const items = itemsByRequirement.get(item.requirement) ?? [];
    items.push(item);
    itemsByRequirement.set(item.requirement, items);
  }

  for (const requirement of RELEASE_APPROVAL_REQUIREMENTS) {
    const items = itemsByRequirement.get(requirement) ?? [];
    if (items.length === 0) {
      findings.push({ requirement, code: "missing_requirement" });
      continue;
    }
    if (items.length > 1) {
      findings.push({ requirement, code: "duplicate_requirement" });
      continue;
    }

    const item = items[0];
    if (item.status !== "approved") {
      findings.push({ requirement, code: "approval_incomplete" });
      continue;
    }
    if (!item.approvedAt) {
      findings.push({ requirement, code: "missing_approval_date" });
    } else if (new Date(item.approvedAt).getTime() > now.getTime()) {
      findings.push({ requirement, code: "future_approval" });
    }
    if (!item.evidenceReference) {
      findings.push({ requirement, code: "missing_evidence_reference" });
    }
    if (!item.approverReference) {
      findings.push({ requirement, code: "missing_approver_reference" });
    }
    if (!item.releaseCommit) {
      findings.push({ requirement, code: "missing_release_commit" });
    }
    if (
      item.validUntil &&
      new Date(item.validUntil).getTime() <= now.getTime()
    ) {
      findings.push({ requirement, code: "expired_approval" });
    }
  }

  const approvedReleaseCommits = new Set(
    parsed.data.items
      .filter((item) => item.status === "approved" && item.releaseCommit)
      .map((item) => item.releaseCommit),
  );
  if (approvedReleaseCommits.size > 1) {
    findings.push({
      requirement: "document",
      code: "inconsistent_release_commit",
    });
  }
  if (
    expectedReleaseCommit &&
    approvedReleaseCommits.size === 1 &&
    !approvedReleaseCommits.has(expectedReleaseCommit)
  ) {
    findings.push({
      requirement: "document",
      code: "candidate_commit_mismatch",
    });
  }

  return {
    valid: findings.length === 0,
    findings: findings.sort((left, right) =>
      `${left.requirement}:${left.code}`.localeCompare(
        `${right.requirement}:${right.code}`,
      ),
    ),
  };
}

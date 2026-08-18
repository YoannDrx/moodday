import { z } from "zod";

export const CREDENTIAL_ROTATION_REQUIREMENTS = [
  { provider: "neon", action: "rotate" },
  { provider: "github_oauth", action: "rotate" },
  { provider: "google_oauth", action: "rotate" },
  { provider: "better_auth", action: "rotate" },
  { provider: "resend", action: "rotate" },
  { provider: "stripe", action: "rotate" },
  { provider: "vercel_blob", action: "rotate" },
  { provider: "vercel_cron", action: "rotate" },
  { provider: "redis", action: "revoke" },
  { provider: "uploadthing", action: "revoke" },
  { provider: "posthog", action: "remove" },
  { provider: "openai", action: "rotate" },
] as const;

const providerSchema = z.enum(
  CREDENTIAL_ROTATION_REQUIREMENTS.map(({ provider }) => provider) as [
    (typeof CREDENTIAL_ROTATION_REQUIREMENTS)[number]["provider"],
    ...(typeof CREDENTIAL_ROTATION_REQUIREMENTS)[number]["provider"][],
  ],
);

const timestampSchema = z.string().datetime({ offset: true });

export const credentialRotationEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  incidentId: z.literal("2026-08-14-vercel-preview-env-upload"),
  items: z.array(
    z.object({
      provider: providerSchema,
      action: z.enum(["rotate", "revoke", "remove"]),
      status: z.enum(["pending", "completed"]),
      oldCredentialDisabledAt: timestampSchema.nullable(),
      newCredentialProvisionedAt: timestampSchema.nullable(),
      activityReviewedAt: timestampSchema.nullable(),
      evidenceReference: z
        .string()
        .min(3)
        .max(200)
        .regex(/^[a-z][a-z0-9-]*:[^\s]+$/i)
        .nullable(),
      operatorReference: z
        .string()
        .min(3)
        .max(64)
        .regex(/^[a-z0-9][a-z0-9_-]+$/i)
        .nullable(),
    }),
  ),
});

export type CredentialRotationEvidence = z.infer<
  typeof credentialRotationEvidenceSchema
>;

export type CredentialRotationFinding = {
  provider: string;
  code:
    | "invalid_document"
    | "missing_provider"
    | "duplicate_provider"
    | "action_mismatch"
    | "rotation_incomplete"
    | "missing_revocation"
    | "missing_new_credential"
    | "missing_activity_review"
    | "missing_evidence_reference"
    | "missing_operator_reference"
    | "future_timestamp";
};

export function auditCredentialRotationEvidence(
  input: unknown,
  now = new Date(),
) {
  const parsed = credentialRotationEvidenceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      findings: [{ provider: "document", code: "invalid_document" as const }],
    };
  }

  const findings: CredentialRotationFinding[] = [];
  const itemsByProvider = new Map<
    string,
    CredentialRotationEvidence["items"]
  >();

  for (const item of parsed.data.items) {
    const items = itemsByProvider.get(item.provider) ?? [];
    items.push(item);
    itemsByProvider.set(item.provider, items);
  }

  for (const requirement of CREDENTIAL_ROTATION_REQUIREMENTS) {
    const items = itemsByProvider.get(requirement.provider) ?? [];
    if (items.length === 0) {
      findings.push({
        provider: requirement.provider,
        code: "missing_provider",
      });
      continue;
    }
    if (items.length > 1) {
      findings.push({
        provider: requirement.provider,
        code: "duplicate_provider",
      });
      continue;
    }

    const item = items[0];
    if (item.action !== requirement.action) {
      findings.push({
        provider: requirement.provider,
        code: "action_mismatch",
      });
    }
    if (item.status !== "completed") {
      findings.push({
        provider: requirement.provider,
        code: "rotation_incomplete",
      });
      continue;
    }
    if (!item.oldCredentialDisabledAt) {
      findings.push({
        provider: requirement.provider,
        code: "missing_revocation",
      });
    }
    if (item.action === "rotate" && !item.newCredentialProvisionedAt) {
      findings.push({
        provider: requirement.provider,
        code: "missing_new_credential",
      });
    }
    if (!item.activityReviewedAt) {
      findings.push({
        provider: requirement.provider,
        code: "missing_activity_review",
      });
    }
    if (!item.evidenceReference) {
      findings.push({
        provider: requirement.provider,
        code: "missing_evidence_reference",
      });
    }
    if (!item.operatorReference) {
      findings.push({
        provider: requirement.provider,
        code: "missing_operator_reference",
      });
    }

    for (const timestamp of [
      item.oldCredentialDisabledAt,
      item.newCredentialProvisionedAt,
      item.activityReviewedAt,
    ]) {
      if (timestamp && new Date(timestamp).getTime() > now.getTime()) {
        findings.push({
          provider: requirement.provider,
          code: "future_timestamp",
        });
      }
    }
  }

  return {
    valid: findings.length === 0,
    findings: findings.sort((left, right) =>
      `${left.provider}:${left.code}`.localeCompare(
        `${right.provider}:${right.code}`,
      ),
    ),
  };
}

import "server-only";
import type { AcceptAccountConsentsInput } from "@moodday/contracts";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const getRequiredConsentVersions = () => ({
  terms: env.LEGAL_TERMS_VERSION,
  privacy: env.LEGAL_PRIVACY_VERSION,
  healthData: env.HEALTH_DATA_CONSENT_VERSION,
  minimumAge: 18 as const,
  country: "FR" as const,
});

export const areConsentVersionsCurrent = (
  versions: AcceptAccountConsentsInput["versions"],
) => {
  const current = getRequiredConsentVersions();
  return (Object.keys(current) as (keyof typeof current)[]).every(
    (key) => versions[key] === current[key],
  );
};

export async function recordRequiredConsents(
  userId: string,
  locale: "fr" | "en",
) {
  const versions = getRequiredConsentVersions();
  // Idempotent: replaying this acceptance never changes its original timestamp.
  // Revoked rows remain revoked; a new legal version is a separate consent.
  await prisma.userConsent.createMany({
    data: [
      { purpose: "age_18" as const, version: String(versions.minimumAge) },
      { purpose: "terms" as const, version: versions.terms },
      { purpose: "privacy" as const, version: versions.privacy },
      { purpose: "health_data" as const, version: versions.healthData },
    ].map((consent) => ({
      ...consent,
      userId,
      locale,
      country: versions.country,
      source: "migration_gate" as const,
    })),
    skipDuplicates: true,
  });
}

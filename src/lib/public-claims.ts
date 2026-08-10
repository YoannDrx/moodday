export type PublicClaimSurface =
  | "about"
  | "landing"
  | "legal"
  | "pricing"
  | "security";

export type PublicClaim = {
  id: string;
  claim: string;
  claimEn: string;
  source: string;
  owner: string;
  reviewedAt: string;
  expiresAt: string;
  allowedSurfaces: PublicClaimSurface[];
};

/**
 * Public statements that are backed by current product behavior. Additions
 * require a named owner and evidence that can be rechecked without accessing
 * health content. Expired statements are never rendered.
 */
export const PUBLIC_CLAIMS: PublicClaim[] = [
  {
    id: "non-medical-companion",
    claim:
      "Moodday est un compagnon de suivi personnel qui ne pose pas de diagnostic et ne remplace pas un professionnel de santé.",
    claimEn:
      "Moodday is a personal tracking companion that does not diagnose and does not replace a healthcare professional.",
    source: "README.md and product scope",
    owner: "product",
    reviewedAt: "2026-08-07",
    expiresAt: "2027-02-07",
    allowedSurfaces: ["about", "landing", "legal", "pricing"],
  },
  {
    id: "user-data-controls",
    claim:
      "Les utilisateurs peuvent exporter leurs données et demander la suppression de leur compte.",
    claimEn:
      "Users can export their data and request deletion of their account.",
    source: "account export and delete flows",
    owner: "engineering",
    reviewedAt: "2026-08-07",
    expiresAt: "2027-02-07",
    allowedSurfaces: ["landing", "legal", "security"],
  },
  {
    id: "caregiver-permissions",
    claim:
      "Le partage aidant est soumis à des permissions explicites et révocables.",
    claimEn:
      "Caregiver sharing is controlled by explicit, revocable permissions.",
    source: "caregiver permission matrix and E2E tests",
    owner: "engineering",
    reviewedAt: "2026-08-07",
    expiresAt: "2027-02-07",
    allowedSurfaces: ["landing", "security"],
  },
];

export function getActivePublicClaims(
  surface: PublicClaimSurface,
  now = new Date(),
) {
  return PUBLIC_CLAIMS.filter(
    (claim) =>
      claim.allowedSurfaces.includes(surface) &&
      new Date(claim.expiresAt).getTime() > now.getTime(),
  );
}

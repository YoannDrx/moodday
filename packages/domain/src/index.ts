import type {
  EntitlementDto,
  SubscriptionProvider,
  SubscriptionSourceStatus,
} from "@moodday/contracts";

export * from "./ally";
export * from "./catalog";
export * from "./cycle";
export * from "./notifications";
export * from "./sharing";

export type SubscriptionSourceProjection = {
  provider: SubscriptionProvider;
  status: SubscriptionSourceStatus;
  currentPeriodEndsAt: Date | null;
};

const grantingSubscriptionStatuses = new Set<SubscriptionSourceStatus>([
  "active",
  "trialing",
  "grace",
]);

/** The Duo subscription covers both members of a couple link. */
export const projectDuoEntitlement = (
  sources: readonly SubscriptionSourceProjection[],
  calculatedAt = new Date(),
): EntitlementDto => {
  const activeSources = sources.filter(
    (source) =>
      grantingSubscriptionStatuses.has(source.status) &&
      (source.currentPeriodEndsAt === null ||
        source.currentPeriodEndsAt.getTime() > calculatedAt.getTime()),
  );
  const sourceProviders = Array.from(
    new Set(activeSources.map((source) => source.provider)),
  );
  const hasOpenEndedSource = activeSources.some(
    (source) => source.currentPeriodEndsAt === null,
  );
  const validUntil = hasOpenEndedSource
    ? null
    : activeSources.reduce<Date | null>((latest, source) => {
        if (!source.currentPeriodEndsAt) return latest;
        return !latest || source.currentPeriodEndsAt > latest
          ? source.currentPeriodEndsAt
          : latest;
      }, null);

  return {
    entitlement: "duo",
    active: activeSources.length > 0,
    sourceProviders,
    validUntil: validUntil?.toISOString() ?? null,
    duplicateSubscription: activeSources.length > 1,
    manageWith:
      activeSources.length === 1 ? (activeSources[0]?.provider ?? null) : null,
    calculatedAt: calculatedAt.toISOString(),
  };
};

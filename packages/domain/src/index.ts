import type {
  CheckInDepth,
  EntitlementDto,
  SubscriptionProvider,
  SubscriptionSourceStatus,
} from "@moodday/contracts";

export type CheckInContext = {
  daysSinceLastCheckIn?: number;
  appointmentWithinDays?: number;
  medicationChangedRecently?: boolean;
  unusualPassiveData?: boolean;
};

export const recommendCheckInDepth = ({
  daysSinceLastCheckIn,
  appointmentWithinDays,
  medicationChangedRecently,
  unusualPassiveData,
}: CheckInContext): CheckInDepth => {
  if (
    medicationChangedRecently === true ||
    unusualPassiveData === true ||
    (appointmentWithinDays !== undefined && appointmentWithinDays <= 3)
  ) {
    return "complete";
  }

  if (daysSinceLastCheckIn !== undefined && daysSinceLastCheckIn >= 7) {
    return "presence";
  }

  return "quick";
};

export type ComparablePair = { x: number; y: number };

export type AssociationResult = {
  coefficient: number;
  direction: "positive" | "negative" | "none";
  comparableDays: number;
};

export const calculateSignedAssociation = (
  pairs: readonly ComparablePair[],
): AssociationResult | null => {
  if (pairs.length < 5) return null;

  const count = pairs.length;
  const xMean = pairs.reduce((sum, pair) => sum + pair.x, 0) / count;
  const yMean = pairs.reduce((sum, pair) => sum + pair.y, 0) / count;

  let numerator = 0;
  let xSquares = 0;
  let ySquares = 0;

  for (const pair of pairs) {
    const xDelta = pair.x - xMean;
    const yDelta = pair.y - yMean;
    numerator += xDelta * yDelta;
    xSquares += xDelta * xDelta;
    ySquares += yDelta * yDelta;
  }

  const denominator = Math.sqrt(xSquares * ySquares);
  if (denominator === 0) return null;

  const coefficient = Math.max(-1, Math.min(1, numerator / denominator));
  const direction =
    Math.abs(coefficient) < 0.1
      ? "none"
      : coefficient > 0
        ? "positive"
        : "negative";

  return { coefficient, direction, comparableDays: count };
};

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

export const projectPlusEntitlement = (
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
  const duplicateSubscription = activeSources.length > 1;

  return {
    entitlement: "plus",
    active: activeSources.length > 0,
    sourceProviders,
    validUntil: validUntil?.toISOString() ?? null,
    duplicateSubscription,
    manageWith:
      activeSources.length === 1 ? (activeSources[0]?.provider ?? null) : null,
    calculatedAt: calculatedAt.toISOString(),
  };
};

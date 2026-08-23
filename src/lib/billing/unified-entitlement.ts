import "server-only";

import { projectPlusEntitlement } from "@moodday/domain";
import { prisma } from "@/lib/prisma";

/**
 * Recomputes the shared entitlement from all purchase sources and maintains the
 * legacy Subscription projection until every V1 feature reads V2 directly.
 */
export async function refreshUnifiedEntitlementProjection(
  userId: string,
  calculatedAt = new Date(),
) {
  const sources = await prisma.subscriptionSource.findMany({
    where: { userId },
    select: { provider: true, status: true, currentPeriodEndsAt: true },
  });
  const entitlement = projectPlusEntitlement(sources, calculatedAt);

  await prisma.$transaction([
    prisma.entitlementSnapshot.create({
      data: {
        userId,
        entitlement: entitlement.entitlement,
        active: entitlement.active,
        sourceProviders: entitlement.sourceProviders,
        validUntil: entitlement.validUntil
          ? new Date(entitlement.validUntil)
          : null,
        calculatedAt,
      },
    }),
    prisma.subscription.upsert({
      where: { referenceId: userId },
      create: {
        id: `entitlement:${userId}`,
        referenceId: userId,
        plan: entitlement.active ? "plus" : "free",
        status: entitlement.active ? "active" : "expired",
        periodEnd: entitlement.validUntil
          ? new Date(entitlement.validUntil)
          : null,
        lastSyncedAt: calculatedAt,
      },
      update: {
        plan: entitlement.active ? "plus" : "free",
        status: entitlement.active ? "active" : "expired",
        periodEnd: entitlement.validUntil
          ? new Date(entitlement.validUntil)
          : null,
        graceEndsAt: null,
        lastSyncedAt: calculatedAt,
      },
    }),
  ]);

  return entitlement;
}

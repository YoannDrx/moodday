import "server-only";

import { prisma } from "@/lib/prisma";
import { projectDuoEntitlement } from "@moodday/domain";

/**
 * Duo is paid once and covers both members of an active couple link, so a
 * partner's subscription sources count as one's own.
 */
export const getDuoEntitlement = async (
  userId: string,
  calculatedAt = new Date(),
) => {
  const link = await prisma.coupleLink.findFirst({
    where: {
      status: "active",
      OR: [{ ownerId: userId }, { supporterId: userId }],
    },
    select: { ownerId: true, supporterId: true },
  });
  const userIds = [userId, link?.ownerId, link?.supporterId].filter(
    (id): id is string => Boolean(id),
  );
  const sources = await prisma.subscriptionSource.findMany({
    where: { userId: { in: [...new Set(userIds)] } },
    select: { provider: true, status: true, currentPeriodEndsAt: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return projectDuoEntitlement(sources, calculatedAt);
};

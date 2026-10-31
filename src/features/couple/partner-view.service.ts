import "server-only";

import { prisma } from "@/lib/prisma";
import { projectPartnerView, type PartnerView } from "@moodday/domain";
import { getCycleSnapshot } from "./cycle.service";
import { getUserContext } from "./shared";

const VIEW_LOG_INTERVAL_MS = 60 * 60 * 1000;

/**
 * The one entry point through which a supporter reads anything about the
 * cycle owner. Filtered by her sharing level and logged without content.
 */
export const readPartnerView = async (
  supporterId: string,
  now = new Date(),
): Promise<PartnerView | null> => {
  const link = await prisma.coupleLink.findFirst({
    where: { supporterId, status: "active", ownerId: { not: null } },
  });
  if (!link?.ownerId) return null;

  const owner = await getUserContext(link.ownerId, now);
  const [cycle, checkIn, customNeeds] = await Promise.all([
    getCycleSnapshot(link.ownerId, owner.today),
    prisma.dailyCheckIn.findUnique({
      where: {
        userId_localDate: {
          userId: link.ownerId,
          localDate: new Date(`${owner.today}T00:00:00.000Z`),
        },
      },
      // The private note is deliberately not selected.
      select: {
        id: true,
        state: true,
        symptoms: true,
        needs: true,
        updatedAt: true,
      },
    }),
    prisma.customNeed.findMany({
      where: { userId: link.ownerId },
      select: { id: true, label: true },
    }),
  ]);

  const lastView = await prisma.accessLog.findFirst({
    where: { linkId: link.id, actorId: supporterId, action: "viewed" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (
    !lastView ||
    now.getTime() - lastView.createdAt.getTime() > VIEW_LOG_INTERVAL_MS
  ) {
    await prisma.accessLog.create({
      data: {
        ownerId: link.ownerId,
        actorId: supporterId,
        linkId: link.id,
        action: "viewed",
        resourceKind: "partner_view",
      },
    });
  }

  return projectPartnerView({
    level: link.level,
    shareSymptoms: link.shareSymptoms,
    pausedUntil: link.pausedUntil,
    now,
    ownerName: owner.name,
    cycle,
    checkIn,
    customNeeds,
  });
};

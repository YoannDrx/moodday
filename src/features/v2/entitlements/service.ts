import { projectPlusEntitlement } from "@moodday/domain";
import { prisma } from "@/lib/prisma";

export const getV2PlusEntitlement = async (
  userId: string,
  calculatedAt = new Date(),
) => {
  const sources = await prisma.subscriptionSource.findMany({
    where: { userId },
    select: {
      provider: true,
      status: true,
      currentPeriodEndsAt: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return projectPlusEntitlement(sources, calculatedAt);
};

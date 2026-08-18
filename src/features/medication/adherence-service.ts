import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getExportDateRange } from "@/features/export/date-range";
import { getDateKeyForTimeZone } from "./schedule";
import { calculateMedicationAdherence } from "./adherence";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export const getMedicationAdherenceForUser = async ({
  userId,
  startDate,
  endDate,
  timezone,
  client = prisma,
}: {
  userId: string;
  startDate: string;
  endDate: string;
  timezone: string;
  client?: DatabaseClient;
}) => {
  const { start, endExclusive } = getExportDateRange({
    startDate,
    endDate,
    timezone,
  });
  const medications = await client.medication.findMany({
    where: {
      userId,
      frequency: { not: "prn" },
    },
    include: {
      intakes: {
        where: {
          OR: [
            { scheduledForDate: { gte: startDate, lte: endDate } },
            {
              scheduledForDate: null,
              takenAt: { gte: start, lt: endExclusive },
            },
          ],
        },
      },
      scheduleRevisions: {
        where: { effectiveDate: { lte: endDate } },
        orderBy: { effectiveDate: "asc" },
      },
    },
  });

  return calculateMedicationAdherence({
    medications,
    startDate,
    endDate,
    todayDate: getDateKeyForTimeZone(new Date(), timezone),
  });
};

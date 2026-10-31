import "server-only";

import { prisma } from "@/lib/prisma";
import {
  addDays,
  computeCycle,
  describePmsWindow,
  phaseLabels,
  type CivilDate,
  type CycleSnapshot,
} from "@moodday/domain";
import { CoupleError, fromCivil, isUniqueViolation, toCivil } from "./shared";

const assertCycleOwner = async (userId: string) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true },
  });
  if (profile?.role !== "cycle_owner") {
    // Product invariant: a partner never writes anything about her cycle.
    throw new CoupleError(
      "cycle_owner_only",
      "Seule la personne concernée renseigne son cycle.",
    );
  }
};

export const listPeriods = async (userId: string) =>
  (
    await prisma.period.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      take: 24,
    })
  ).map((period) => ({
    id: period.id,
    startDate: toCivil(period.startDate),
    endDate: period.endDate ? toCivil(period.endDate) : null,
  }));

export const startPeriod = async (
  userId: string,
  date: CivilDate,
  today: CivilDate,
) => {
  await assertCycleOwner(userId);
  if (date > today) {
    throw new CoupleError(
      "future_date",
      "On ne déclare pas des règles futures.",
    );
  }
  const open = await prisma.period.findFirst({
    where: {
      userId,
      endDate: null,
      startDate: { gte: fromCivil(addDays(date, -10)) },
    },
  });
  if (open) {
    throw new CoupleError("period_open", "Des règles sont déjà en cours.");
  }
  try {
    return await prisma.period.create({
      data: { userId, startDate: fromCivil(date) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CoupleError("period_exists", "Ces règles sont déjà notées.");
    }
    throw error;
  }
};

export const endPeriod = async (userId: string, date: CivilDate) => {
  await assertCycleOwner(userId);
  const open = await prisma.period.findFirst({
    where: { userId, endDate: null },
    orderBy: { startDate: "desc" },
  });
  if (!open) {
    throw new CoupleError("no_open_period", "Aucunes règles en cours.");
  }
  if (date < toCivil(open.startDate)) {
    throw new CoupleError("end_before_start", "La fin précède le début.");
  }
  return prisma.period.update({
    where: { id: open.id },
    data: { endDate: fromCivil(date) },
  });
};

export const updatePeriod = async (
  userId: string,
  input: { periodId: string; startDate: CivilDate; endDate: CivilDate | null },
) => {
  await assertCycleOwner(userId);
  const result = await prisma.period.updateMany({
    where: { id: input.periodId, userId },
    data: {
      startDate: fromCivil(input.startDate),
      endDate: input.endDate ? fromCivil(input.endDate) : null,
    },
  });
  if (result.count === 0) {
    throw new CoupleError("not_found", "Ces règles sont introuvables.");
  }
};

export const deletePeriod = async (userId: string, periodId: string) => {
  await assertCycleOwner(userId);
  await prisma.period.deleteMany({ where: { id: periodId, userId } });
};

export type CycleView = CycleSnapshot & {
  phaseTitle: string;
  pmsInsight: string | null;
};

export const getCycleSnapshot = async (
  userId: string,
  today: CivilDate,
): Promise<CycleView> => {
  const since = fromCivil(addDays(today, -240));
  const [profile, periods, checkIns] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { typicalCycleLength: true, typicalPeriodLength: true },
    }),
    prisma.period.findMany({
      where: { userId, startDate: { gte: since } },
      orderBy: { startDate: "asc" },
    }),
    prisma.dailyCheckIn.findMany({
      where: { userId, localDate: { gte: since } },
      select: { localDate: true, state: true },
    }),
  ]);

  const snapshot = computeCycle({
    today,
    periods: periods.map((period) => ({
      startDate: toCivil(period.startDate),
      endDate: period.endDate ? toCivil(period.endDate) : null,
    })),
    checkIns: checkIns.map((checkIn) => ({
      localDate: toCivil(checkIn.localDate),
      state: checkIn.state,
    })),
    typicalCycleLength: profile?.typicalCycleLength,
    typicalPeriodLength: profile?.typicalPeriodLength,
  });

  return {
    ...snapshot,
    phaseTitle: phaseLabels[snapshot.phase].title,
    pmsInsight: describePmsWindow(snapshot.pmsWindow),
  };
};

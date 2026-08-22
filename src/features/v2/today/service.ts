import type { TodayDto } from "@moodday/contracts";
import { prisma } from "@/lib/prisma";
import { listCheckIns } from "../check-ins/service";

export const getToday = async ({
  userId,
  localDate,
}: {
  userId: string;
  localDate: string;
}): Promise<TodayDto> => {
  const [checkIns, nextAppointment, routines, sources] = await Promise.all([
    listCheckIns({ userId, limit: 1 }),
    prisma.appointment.findFirst({
      where: { userId, status: "scheduled", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        preparationStatus: true,
      },
    }),
    prisma.routine.findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, weeklyTarget: true },
    }),
    prisma.sourceConnection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, kind: true, status: true, lastSyncedAt: true },
    }),
  ]);

  const latestCheckIn =
    checkIns.items[0]?.localDate === localDate ? checkIns.items[0] : null;
  const appointmentSoon =
    nextAppointment &&
    nextAppointment.startsAt.getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000;

  return {
    localDate,
    recommendedAction: !latestCheckIn
      ? "check_in"
      : appointmentSoon
        ? "appointment_preparation"
        : routines.length > 0
          ? "routine"
          : "none",
    latestCheckIn,
    nextAppointment: nextAppointment
      ? { ...nextAppointment, startsAt: nextAppointment.startsAt.toISOString() }
      : null,
    routines,
    sources: sources.map((source) => ({
      ...source,
      lastSyncedAt: source.lastSyncedAt?.toISOString() ?? null,
    })),
  };
};

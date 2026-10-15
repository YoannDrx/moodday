import "server-only";

import { prisma } from "@/lib/prisma";
import { getExportDateRange } from "@/features/export/date-range";
import {
  civilMidnightToUtc,
  getDateKeyForTimeZone,
} from "@/lib/temporal/civil-date";

/** A read projection, never a second write to the historical journal. */
export async function readMoodRange(input: {
  userId: string;
  startDate: string;
  endDate: string;
  timezone: string;
}) {
  const { start, endExclusive, timezone } = getExportDateRange(input);
  const [legacy, checkIns] = await Promise.all([
    prisma.moodEntry.findMany({
      where: {
        userId: input.userId,
        createdAt: { gte: start, lt: endExclusive },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        value: true,
        energy: true,
        anxiety: true,
        sleepHours: true,
        sleepQuality: true,
        note: true,
        createdAt: true,
      },
    }),
    prisma.checkIn.findMany({
      // createdAt is the import time for offline entries, not the tracked day.
      where: {
        userId: input.userId,
        localDate: { gte: input.startDate, lte: input.endDate },
      },
      orderBy: [{ localDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        depth: true,
        localDate: true,
        valence: true,
        activation: true,
        anxiety: true,
        irritability: true,
        createdAt: true,
      },
    }),
  ]);

  const entries = [
    ...legacy.map((entry) => ({
      ...entry,
      localDate: getDateKeyForTimeZone(entry.createdAt, timezone),
      source: "journal" as const,
      timePrecision: "instant" as const,
      irritability: null as number | null,
    })),
    ...checkIns.flatMap((entry) =>
      entry.depth === "presence" || entry.valence === null
        ? []
        : [
            {
              id: `check-in:${entry.id}`,
              value: entry.valence,
              energy: entry.activation,
              anxiety: entry.anxiety,
              irritability: entry.irritability,
              sleepHours: null,
              sleepQuality: null,
              // Private check-in notes are not automatically copied to insights/briefs.
              note: null,
              localDate: entry.localDate,
              source: "check-in" as const,
              timePrecision: "day" as const,
              // Compatibility coordinate for date-based consumers, not a measured time.
              createdAt: civilMidnightToUtc(entry.localDate, timezone),
            },
          ],
    ),
  ].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

  return {
    entries,
    // Presence does count as participation, never as a numeric mood observation.
    recordedDates: [
      ...new Set([
        ...entries.map((entry) => entry.localDate),
        ...checkIns.map((entry) => entry.localDate),
      ]),
    ].sort(),
  };
}

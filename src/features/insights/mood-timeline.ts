import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  civilMidnightToUtc,
  getDateKeyForTimeZone,
} from "@/lib/temporal/civil-date";

// Mood history lives in two tables: the daily check-in (`CheckIn`, written by
// Today) and the older journal entry (`MoodEntry`, still written by imports
// and the journal). Every reader of mood history goes through this module so
// that a check-in shows up in Repères, the consultation PDF and the caregiver
// summary exactly like a journal entry.

type TimelineClient = Pick<Prisma.TransactionClient, "moodEntry" | "checkIn">;

export type MoodTimelineRange = {
  userId: string;
  /** Civil date keys (YYYY-MM-DD) in `timezone`, inclusive. */
  startDate: string;
  endDate: string;
  /** Instants matching the civil range, end exclusive. */
  start: Date;
  endExclusive: Date;
  timezone: string;
  client?: TimelineClient;
};

export type MoodTimelineEntry = {
  id: string;
  source: "mood_entry" | "check_in";
  /** 0-10. A check-in's valence uses the same scale as a journal mood. */
  value: number;
  energy: number | null;
  anxiety: number | null;
  sleepHours: number | null;
  sleepQuality: string | null;
  note: string | null;
  date: Date;
};

const HALF_DAY_MS = 12 * 60 * 60 * 1000;

/**
 * A check-in describes the civil day in `localDate`; an offline check-in may
 * reach the server days later. Keep the real time when it falls on that day,
 * otherwise place it at midday so day bucketing in `timezone` stays correct.
 */
export const getCheckInInstant = (
  checkIn: { localDate: string; createdAt: Date },
  timezone: string,
) =>
  getDateKeyForTimeZone(checkIn.createdAt, timezone) === checkIn.localDate
    ? checkIn.createdAt
    : new Date(
        civilMidnightToUtc(checkIn.localDate, timezone).getTime() + HALF_DAY_MS,
      );

const checkInDateWhere = (range: MoodTimelineRange) => ({
  userId: range.userId,
  localDate: { gte: range.startDate, lte: range.endDate },
});

const moodEntryDateWhere = (range: MoodTimelineRange) => ({
  userId: range.userId,
  createdAt: { gte: range.start, lt: range.endExclusive },
});

/** Scored mood entries in the range, oldest first. Presence-only check-ins carry no score and are left out. */
export const listMoodTimeline = async (
  range: MoodTimelineRange,
): Promise<MoodTimelineEntry[]> => {
  const client = range.client ?? prisma;
  const [moodEntries, checkIns] = await Promise.all([
    client.moodEntry.findMany({
      where: moodEntryDateWhere(range),
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
    client.checkIn.findMany({
      where: { ...checkInDateWhere(range), valence: { not: null } },
      orderBy: [{ localDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        localDate: true,
        valence: true,
        activation: true,
        anxiety: true,
        note: true,
        createdAt: true,
      },
    }),
  ]);

  const entries: MoodTimelineEntry[] = [
    ...moodEntries.map((entry) => ({
      id: entry.id,
      source: "mood_entry" as const,
      value: entry.value,
      energy: entry.energy,
      anxiety: entry.anxiety,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality,
      note: entry.note,
      date: entry.createdAt,
    })),
    ...checkIns.flatMap((checkIn) =>
      checkIn.valence === null
        ? []
        : [
            {
              id: checkIn.id,
              source: "check_in" as const,
              value: checkIn.valence,
              energy: checkIn.activation,
              anxiety: checkIn.anxiety,
              sleepHours: null,
              sleepQuality: null,
              note: checkIn.note,
              date: getCheckInInstant(checkIn, range.timezone),
            },
          ],
    ),
  ];

  return entries.sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );
};

/** Number of scored entries in the range, matching `listMoodTimeline`. */
export const countMoodTimeline = async (range: MoodTimelineRange) => {
  const client = range.client ?? prisma;
  const [moodEntries, checkIns] = await Promise.all([
    client.moodEntry.count({ where: moodEntryDateWhere(range) }),
    client.checkIn.count({
      where: { ...checkInDateWhere(range), valence: { not: null } },
    }),
  ]);
  return moodEntries + checkIns;
};

/** Instants of every journal entry or check-in in the range, scored or not. */
export const listJournalActivityDates = async (
  range: MoodTimelineRange,
): Promise<Date[]> => {
  const client = range.client ?? prisma;
  const [moodEntries, checkIns] = await Promise.all([
    client.moodEntry.findMany({
      where: moodEntryDateWhere(range),
      select: { createdAt: true },
    }),
    client.checkIn.findMany({
      where: checkInDateWhere(range),
      select: { localDate: true, createdAt: true },
    }),
  ]);
  return [
    ...moodEntries.map((entry) => entry.createdAt),
    ...checkIns.map((checkIn) => getCheckInInstant(checkIn, range.timezone)),
  ];
};

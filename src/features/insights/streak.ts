import { addCivilDays, getDateKeyForTimeZone } from "@/lib/temporal/civil-date";

export const calculateMoodStreak = ({
  entryDates,
  todayDate,
  timeZone,
  maximumDays = 90,
}: {
  entryDates: Date[];
  todayDate: string;
  timeZone: string;
  maximumDays?: number;
}) => {
  const daysWithEntries = new Set(
    entryDates.map((date) => getDateKeyForTimeZone(date, timeZone)),
  );
  let checkDate = daysWithEntries.has(todayDate)
    ? todayDate
    : addCivilDays(todayDate, -1);
  let streakDays = 0;

  while (streakDays < maximumDays && daysWithEntries.has(checkDate)) {
    streakDays += 1;
    checkDate = addCivilDays(checkDate, -1);
  }

  const weekProgress = Array.from({ length: 7 }, (_, index) =>
    daysWithEntries.has(addCivilDays(todayDate, index - 6)) ? 1 : 0,
  ) as (0 | 1)[];

  return {
    streakDays,
    weekProgress,
    hasEntryToday: daysWithEntries.has(todayDate),
  };
};

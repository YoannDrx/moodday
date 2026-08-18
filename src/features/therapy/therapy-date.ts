import {
  civilMidnightToUtc,
  getDateKeyForTimeZone,
  getSafeTimeZone,
  parseCivilDateKey,
} from "@/lib/temporal/civil-date";

export const normalizeTherapyCivilDate = (
  value: string | Date,
  timeZone?: string | null,
) => {
  const timezone = getSafeTimeZone(timeZone);
  let dateKey: string;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parseCivilDateKey(value);
    dateKey = value;
  } else {
    const instant = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(instant.getTime()))
      throw new Error("Invalid therapy date");
    dateKey = getDateKeyForTimeZone(instant, timezone);
  }

  return {
    dateKey,
    date: civilMidnightToUtc(dateKey, timezone),
    timezone,
  };
};

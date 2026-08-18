const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Moodday launches in France; this is the deterministic fallback for missing data. */
export const DEFAULT_TIME_ZONE = "Europe/Paris";

export const parseCivilDateKey = (dateKey: string) => {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) throw new Error("Invalid civil date key");
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== dateKey) {
    throw new Error("Invalid civil date key");
  }
  return date;
};

export const addCivilDays = (dateKey: string, days: number) => {
  const date = parseCivilDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const enumerateCivilDateKeys = (startDate: string, endDate: string) => {
  if (startDate > endDate) return [];
  parseCivilDateKey(startDate);
  parseCivilDateKey(endDate);
  const dates: string[] = [];
  for (
    let cursor = startDate;
    cursor <= endDate;
    cursor = addCivilDays(cursor, 1)
  ) {
    dates.push(cursor);
  }
  return dates;
};

export const getCivilDateRangeDayCount = (
  startDate: string,
  endDate: string,
) => {
  const start = parseCivilDateKey(startDate).getTime();
  const end = parseCivilDateKey(endDate).getTime();
  return end < start
    ? 0
    : Math.floor((end - start) / (24 * 60 * 60 * 1_000)) + 1;
};

/** Sunday = 0 through Saturday = 6, independent of the server time zone. */
export const getCivilWeekday = (dateKey: string) =>
  parseCivilDateKey(dateKey).getUTCDay();

export const clampCivilDateRange = ({
  startDate,
  endDate,
  minimum,
  maximum,
}: {
  startDate: string;
  endDate: string;
  minimum?: string | null;
  maximum?: string | null;
}) => ({
  startDate: minimum && minimum > startDate ? minimum : startDate,
  endDate: maximum && maximum < endDate ? maximum : endDate,
});

export const isValidIanaTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
};

export const getSafeTimeZone = (
  timeZone?: string | null,
  fallback = DEFAULT_TIME_ZONE,
) => {
  const safeFallback = isValidIanaTimeZone(fallback)
    ? fallback
    : DEFAULT_TIME_ZONE;
  return timeZone && isValidIanaTimeZone(timeZone) ? timeZone : safeFallback;
};

const getDateTimeParts = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (value === undefined) throw new Error("Unable to format civil date");
    return Number(value);
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
};

export const getDateKeyForTimeZone = (
  instant = new Date(),
  timeZone?: string | null,
) => {
  const parts = getDateTimeParts(instant, getSafeTimeZone(timeZone));
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
};

/** Converts an IANA-zone civil midnight to its exact UTC instant. */
export const civilMidnightToUtc = (
  dateKey: string,
  timeZone?: string | null,
) => {
  const civilDate = parseCivilDateKey(dateKey);
  const safeTimeZone = getSafeTimeZone(timeZone);
  const target = civilDate.getTime();
  let candidate = target;

  // Offset iteration handles DST without relying on the server's own timezone.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getDateTimeParts(new Date(candidate), safeTimeZone);
    const representedLocalTime = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const adjustment = target - representedLocalTime;
    candidate += adjustment;
    if (adjustment === 0) break;
  }

  return new Date(candidate);
};

export const getCivilDateRange = ({
  startDate,
  endDate,
  timeZone,
}: {
  startDate: string;
  endDate: string;
  timeZone?: string | null;
}) => {
  parseCivilDateKey(startDate);
  parseCivilDateKey(endDate);
  if (endDate < startDate) throw new Error("Invalid civil date range");

  const safeTimeZone = getSafeTimeZone(timeZone);
  return {
    start: civilMidnightToUtc(startDate, safeTimeZone),
    endExclusive: civilMidnightToUtc(addCivilDays(endDate, 1), safeTimeZone),
    timeZone: safeTimeZone,
  };
};

export const getCivilDayRange = (dateKey: string, timeZone?: string | null) =>
  getCivilDateRange({ startDate: dateKey, endDate: dateKey, timeZone });

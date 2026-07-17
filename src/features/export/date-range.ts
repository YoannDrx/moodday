import { getSafeTimeZone } from "@/features/notifications/schedule";

const dateTimeParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
};

const localMidnightToUtc = (dateKey: string, timeZone: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = dateTimeParts(new Date(candidate), timeZone);
    const representedLocalTime = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    candidate += target - representedLocalTime;
  }

  return new Date(candidate);
};

const addUtcDays = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

export const getExportDateRange = (params: {
  startDate: string;
  endDate: string;
  timezone?: string | null;
}) => {
  const timezone = getSafeTimeZone(params.timezone);
  const start = localMidnightToUtc(params.startDate, timezone);
  const endExclusive = localMidnightToUtc(
    addUtcDays(params.endDate, 1),
    timezone,
  );

  return { start, endExclusive, timezone };
};

import { getCivilDateRange } from "@/lib/temporal/civil-date";

export const getExportDateRange = (params: {
  startDate: string;
  endDate: string;
  timezone?: string | null;
}) => {
  const range = getCivilDateRange({
    startDate: params.startDate,
    endDate: params.endDate,
    timeZone: params.timezone,
  });
  return {
    start: range.start,
    endExclusive: range.endExclusive,
    timezone: range.timeZone,
  };
};

import type {
  CheckInDto,
  DoseEventDto,
  RoutineOccurrenceDto,
} from "@moodday/contracts";

export function buildWeeklyLandmarks(input: {
  today: string;
  checkIns: readonly CheckInDto[];
  doseEvents: readonly DoseEventDto[];
  routines: readonly RoutineOccurrenceDto[];
}) {
  // Calendar arithmetic on local-date strings avoids 23/25-hour DST days.
  const start = new Date(`${input.today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  const from = start.toISOString().slice(0, 10);
  const inPeriod = (date: string) => date >= from && date <= input.today;
  const unique = <T extends { id: string }>(rows: readonly T[]) => [
    ...new Map(rows.map((row) => [row.id, row])).values(),
  ];
  const checkIns = unique(input.checkIns).filter((entry) =>
    inPeriod(entry.localDate),
  );
  const scored = checkIns.filter(
    (entry) =>
      entry.depth !== "presence" &&
      entry.valence != null &&
      entry.activation != null &&
      entry.irritability != null,
  );
  const days = new Set(checkIns.map((entry) => entry.localDate)).size;
  const scoredDays = new Set(scored.map((entry) => entry.localDate)).size;
  const doses = unique(input.doseEvents).filter(
    (entry) =>
      inPeriod(entry.localDate) &&
      !entry.cancelledAt &&
      ["taken", "prn"].includes(entry.kind),
  );
  const routines = unique(input.routines).filter(
    (entry) => inPeriod(entry.localDate) && entry.status === "completed",
  );
  return {
    from,
    to: input.today,
    days,
    scoredDays,
    coverage: Math.round((scoredDays / 7) * 100),
    checkInCount: checkIns.length,
    dosesTaken: doses.length,
    routinesCompleted: routines.length,
    // No notes or medication names enter this summary.
    timeline: checkIns
      .sort(
        (left, right) =>
          right.localDate.localeCompare(left.localDate) ||
          right.createdAt.localeCompare(left.createdAt),
      )
      .map((entry) => ({
        id: entry.id,
        localDate: entry.localDate,
        timezone: entry.timezone,
        depth: entry.depth,
        valence: entry.valence,
        activation: entry.activation,
        irritability: entry.irritability,
      })),
  };
}

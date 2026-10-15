import { calculateSignedAssociation } from "@moodday/domain";

/** Same-day paired observations, reduced to one equally weighted pair per day. */
export function calculateDailyAssociation(
  observations: readonly {
    localDate: string;
    x: number;
    y: number | null | undefined;
  }[],
  periodDays: number,
) {
  const days = new Map<string, { x: number; y: number; count: number }>();
  for (const observation of observations) {
    if (
      observation.y == null ||
      !Number.isFinite(observation.x) ||
      !Number.isFinite(observation.y)
    )
      continue;
    const day = days.get(observation.localDate) ?? { x: 0, y: 0, count: 0 };
    day.x += observation.x;
    day.y += observation.y;
    day.count += 1;
    days.set(observation.localDate, day);
  }
  const comparableDays = days.size;
  const coverage =
    periodDays > 0 ? Math.min(1, comparableDays / periodDays) : 0;
  const association =
    coverage >= 0.5
      ? calculateSignedAssociation(
          [...days.values()].map((day) => ({
            x: day.x / day.count,
            y: day.y / day.count,
          })),
        )
      : null;
  return { association, comparableDays, coverage };
}

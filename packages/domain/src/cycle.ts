import { isDifficultState, type CheckInStateKey } from "./catalog";

// Civil dates are "YYYY-MM-DD" strings. All arithmetic happens in UTC so that
// daylight saving changes never shift a day.

export type CivilDate = string;

const DAY_MS = 86_400_000;

export const toUtcMs = (date: CivilDate) => {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

export const fromUtcMs = (ms: number): CivilDate =>
  new Date(ms).toISOString().slice(0, 10);

export const addDays = (date: CivilDate, days: number) =>
  fromUtcMs(toUtcMs(date) + days * DAY_MS);

export const daysBetween = (from: CivilDate, to: CivilDate) =>
  Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);

export const civilDateInTimeZone = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};

export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 45;
export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const DEFAULT_PMS_WINDOW = 7;
const MAX_PMS_WINDOW = 14;

export type PeriodInput = { startDate: CivilDate; endDate: CivilDate | null };
export type CheckInPoint = { localDate: CivilDate; state: CheckInStateKey };

export type CyclePhase = "period" | "between" | "before" | "late" | "unknown";

export type PmsWindow = {
  daysBefore: number;
  source: "default" | "personal";
  cyclesAnalysed: number;
};

export type CycleSnapshot = {
  today: CivilDate;
  lastPeriodStart: CivilDate | null;
  periodOngoing: boolean;
  cycleDay: number | null;
  averageCycleLength: number;
  averagePeriodLength: number;
  completedCycles: number;
  confidence: "none" | "low" | "medium" | "high";
  nextPeriodStart: CivilDate | null;
  daysUntilNextPeriod: number | null;
  pmsWindow: PmsWindow;
  inPmsWindow: boolean;
  phase: CyclePhase;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const standardDeviation = (values: readonly number[]) => {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

const sortPeriods = (periods: readonly PeriodInput[]) =>
  [...periods].sort((a, b) => toUtcMs(a.startDate) - toUtcMs(b.startDate));

/** Lengths of complete cycles, most recent last, ignoring implausible gaps. */
export const completedCycleLengths = (periods: readonly PeriodInput[]) => {
  const sorted = sortPeriods(periods);
  const lengths: number[] = [];
  let previous: PeriodInput | undefined;
  for (const period of sorted) {
    const length = previous
      ? daysBetween(previous.startDate, period.startDate)
      : 0;
    previous = period;
    // A skipped month or a typo would otherwise wreck the average.
    if (length >= MIN_CYCLE_LENGTH - 3 && length <= MAX_CYCLE_LENGTH + 15) {
      lengths.push(length);
    }
  }
  return lengths;
};

/**
 * Personal premenstrual window, learnt only from her own check-ins: for each
 * completed cycle we look at the days before the next period and keep the
 * longest run of days that were mostly difficult. Purely descriptive.
 */
export const learnPmsWindow = (
  periods: readonly PeriodInput[],
  checkIns: readonly CheckInPoint[],
): PmsWindow => {
  const sorted = sortPeriods(periods);
  const byDate = new Map(checkIns.map((point) => [point.localDate, point]));
  const difficultByOffset = new Map<
    number,
    { difficult: number; total: number }
  >();
  let cyclesAnalysed = 0;

  for (const [index, period] of sorted.entries()) {
    if (index === 0) continue;
    const nextStart = period.startDate;
    let observed = 0;
    for (let offset = 1; offset <= MAX_PMS_WINDOW; offset += 1) {
      const point = byDate.get(addDays(nextStart, -offset));
      if (!point) continue;
      observed += 1;
      const bucket = difficultByOffset.get(offset) ?? {
        difficult: 0,
        total: 0,
      };
      bucket.total += 1;
      if (isDifficultState(point.state)) bucket.difficult += 1;
      difficultByOffset.set(offset, bucket);
    }
    if (observed >= 3) cyclesAnalysed += 1;
  }

  if (cyclesAnalysed < 2) {
    return {
      daysBefore: DEFAULT_PMS_WINDOW,
      source: "default",
      cyclesAnalysed,
    };
  }

  let daysBefore = 0;
  for (let offset = 1; offset <= MAX_PMS_WINDOW; offset += 1) {
    const bucket = difficultByOffset.get(offset);
    if (!bucket || bucket.total < 2) continue;
    if (bucket.difficult / bucket.total >= 0.5) daysBefore = offset;
    else break;
  }

  if (daysBefore < 2) {
    return {
      daysBefore: DEFAULT_PMS_WINDOW,
      source: "default",
      cyclesAnalysed,
    };
  }
  return { daysBefore, source: "personal", cyclesAnalysed };
};

export const computeCycle = (input: {
  today: CivilDate;
  periods: readonly PeriodInput[];
  checkIns?: readonly CheckInPoint[];
  typicalCycleLength?: number | null;
  typicalPeriodLength?: number | null;
}): CycleSnapshot => {
  const sorted = sortPeriods(
    input.periods.filter(
      (period) => toUtcMs(period.startDate) <= toUtcMs(input.today),
    ),
  );
  const lengths = completedCycleLengths(sorted).slice(-6);
  const typical = input.typicalCycleLength
    ? clamp(input.typicalCycleLength, MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH)
    : DEFAULT_CYCLE_LENGTH;
  const averageCycleLength = lengths.length
    ? clamp(Math.round(mean(lengths)), MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH)
    : typical;

  const closedPeriodLengths = sorted
    .flatMap((period) =>
      period.endDate ? [daysBetween(period.startDate, period.endDate) + 1] : [],
    )
    .filter((length) => length >= 1 && length <= 12)
    .slice(-6);
  const averagePeriodLength = closedPeriodLengths.length
    ? Math.round(mean(closedPeriodLengths))
    : (input.typicalPeriodLength ?? DEFAULT_PERIOD_LENGTH);

  const confidence: CycleSnapshot["confidence"] =
    sorted.length === 0
      ? "none"
      : lengths.length < 2
        ? "low"
        : lengths.length >= 4 && standardDeviation(lengths) <= 3
          ? "high"
          : "medium";

  const pmsWindow = learnPmsWindow(sorted, input.checkIns ?? []);
  const last = sorted.at(-1) ?? null;

  if (!last) {
    return {
      today: input.today,
      lastPeriodStart: null,
      periodOngoing: false,
      cycleDay: null,
      averageCycleLength,
      averagePeriodLength,
      completedCycles: 0,
      confidence,
      nextPeriodStart: null,
      daysUntilNextPeriod: null,
      pmsWindow,
      inPmsWindow: false,
      phase: "unknown",
    };
  }

  const cycleDay = daysBetween(last.startDate, input.today) + 1;
  const periodOngoing =
    last.endDate === null
      ? cycleDay <= 10
      : toUtcMs(input.today) <= toUtcMs(last.endDate);
  const nextPeriodStart = addDays(last.startDate, averageCycleLength);
  const daysUntilNextPeriod = daysBetween(input.today, nextPeriodStart);
  const inPmsWindow =
    !periodOngoing &&
    daysUntilNextPeriod >= 1 &&
    daysUntilNextPeriod <= pmsWindow.daysBefore;

  const phase: CyclePhase = periodOngoing
    ? "period"
    : daysUntilNextPeriod < 0
      ? "late"
      : inPmsWindow
        ? "before"
        : "between";

  return {
    today: input.today,
    lastPeriodStart: last.startDate,
    periodOngoing,
    cycleDay,
    averageCycleLength,
    averagePeriodLength,
    completedCycles: lengths.length,
    confidence,
    nextPeriodStart,
    daysUntilNextPeriod,
    pmsWindow,
    inPmsWindow,
    phase,
  };
};

export const phaseLabels: Record<
  CyclePhase,
  { title: string; partner: string }
> = {
  period: {
    title: "Règles en cours",
    partner: "Ses règles sont en cours.",
  },
  between: {
    title: "Entre-deux",
    partner: "Période plutôt calme du cycle.",
  },
  before: {
    title: "Avant les règles",
    partner: "Ses règles approchent.",
  },
  late: {
    title: "Règles attendues",
    partner: "Ses règles sont attendues.",
  },
  unknown: {
    title: "Cycle à découvrir",
    partner: "Elle n'a pas encore renseigné son cycle.",
  },
};

/** A descriptive sentence about her own past cycles. Never a diagnosis. */
export const describePmsWindow = (window: PmsWindow) =>
  window.source === "personal"
    ? `Sur tes ${window.cyclesAnalysed} derniers cycles, les journées plus difficiles commencent souvent vers J-${window.daysBefore}.`
    : null;

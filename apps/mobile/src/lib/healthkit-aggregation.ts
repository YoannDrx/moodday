import type {
  HealthAggregateWriteInput,
  HealthMetric,
  HealthPermission,
} from "@moodday/contracts";

export const HEALTHKIT_ALGORITHM_VERSION = "healthkit-daily-v1";

export type LocalHealthSample = {
  id: string;
  metric: HealthMetric;
  startDate: string;
  endDate: string;
  value?: number;
  sleepValue?: number;
  sourceName?: string;
  deviceModel?: string;
};

const metricUnits: Record<HealthMetric, string> = {
  sleep_duration_minutes: "min",
  step_count: "count",
  active_energy_kcal: "kcal",
  resting_heart_rate_bpm: "count/min",
  hrv_sdnn_ms: "ms",
  workout_minutes: "min",
};

const meanMetrics = new Set<HealthMetric>([
  "resting_heart_rate_bpm",
  "hrv_sdnn_ms",
]);

const asleepValues = new Set([1, 3, 4, 5]);

const mergeDurationMinutes = (samples: readonly LocalHealthSample[]) => {
  const intervals = samples
    .filter((sample) => asleepValues.has(sample.sleepValue ?? -1))
    .map(
      (sample) =>
        [
          new Date(sample.startDate).getTime(),
          new Date(sample.endDate).getTime(),
        ] as const,
    )
    .filter(([start, end]) => Number.isFinite(start) && end > start)
    .sort(([left], [right]) => left - right);
  if (intervals.length === 0) return null;
  let [start, end] = intervals[0] ?? [0, 0];
  let duration = 0;
  for (const [nextStart, nextEnd] of intervals.slice(1)) {
    if (nextStart <= end) {
      end = Math.max(end, nextEnd);
    } else {
      duration += end - start;
      start = nextStart;
      end = nextEnd;
    }
  }
  return (duration + end - start) / 60_000;
};

export const aggregateHealthSamples = ({
  connectionId,
  localDate,
  timezone,
  windowStart,
  windowEnd,
  permissions,
  samples,
  isPartialWindow,
}: {
  connectionId: string;
  localDate: string;
  timezone: string;
  windowStart: string;
  windowEnd: string;
  permissions: readonly HealthPermission[];
  samples: readonly LocalHealthSample[];
  isPartialWindow: boolean;
}): HealthAggregateWriteInput[] =>
  permissions.flatMap((metric) => {
    const matching = samples.filter((sample) => sample.metric === metric);
    if (matching.length === 0) return [];
    const value =
      metric === "sleep_duration_minutes"
        ? mergeDurationMinutes(matching)
        : meanMetrics.has(metric)
          ? matching.reduce((sum, sample) => sum + (sample.value ?? 0), 0) /
            matching.length
          : matching.reduce((sum, sample) => sum + (sample.value ?? 0), 0);
    if (value == null || !Number.isFinite(value)) return [];
    return [
      {
        operationId: `hk:v1:${metric}:${localDate}`,
        sourceConnectionId: connectionId,
        metric,
        value: Math.round(value * 100) / 100,
        unit: metricUnits[metric],
        localDate,
        timezone,
        windowStart,
        windowEnd,
        coverage: null,
        quality: isPartialWindow ? "partial" : "complete",
        algorithmVersion: HEALTHKIT_ALGORITHM_VERSION,
      },
    ];
  });

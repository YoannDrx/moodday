import { describe, expect, it } from "vitest";
import { aggregateHealthSamples } from "../apps/mobile/src/lib/healthkit-aggregation";

const base = {
  connectionId: "health-connection-1",
  localDate: "2026-08-23",
  timezone: "Europe/Paris",
  windowStart: "2026-08-22T22:00:00.000Z",
  windowEnd: "2026-08-23T18:00:00.000Z",
  isPartialWindow: true,
} as const;

describe("HealthKit daily aggregation", () => {
  it("never creates zero aggregates when a metric has no samples", () => {
    expect(
      aggregateHealthSamples({
        ...base,
        permissions: ["step_count", "resting_heart_rate_bpm"],
        samples: [],
      }),
    ).toEqual([]);
  });

  it("sums activity and averages point-in-time heart measures", () => {
    const aggregates = aggregateHealthSamples({
      ...base,
      permissions: ["step_count", "resting_heart_rate_bpm"],
      samples: [
        {
          id: "steps-1",
          metric: "step_count",
          value: 1200,
          startDate: "2026-08-23T07:00:00.000Z",
          endDate: "2026-08-23T08:00:00.000Z",
        },
        {
          id: "steps-2",
          metric: "step_count",
          value: 800,
          startDate: "2026-08-23T09:00:00.000Z",
          endDate: "2026-08-23T10:00:00.000Z",
        },
        {
          id: "heart-1",
          metric: "resting_heart_rate_bpm",
          value: 60,
          startDate: "2026-08-23T06:00:00.000Z",
          endDate: "2026-08-23T06:01:00.000Z",
        },
        {
          id: "heart-2",
          metric: "resting_heart_rate_bpm",
          value: 64,
          startDate: "2026-08-23T07:00:00.000Z",
          endDate: "2026-08-23T07:01:00.000Z",
        },
      ],
    });

    expect(aggregates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric: "step_count",
          value: 2000,
          unit: "count",
          quality: "partial",
          coverage: null,
        }),
        expect.objectContaining({
          metric: "resting_heart_rate_bpm",
          value: 62,
          unit: "count/min",
        }),
      ]),
    );
  });

  it("merges overlapping sleep intervals instead of double counting sources", () => {
    const [aggregate] = aggregateHealthSamples({
      ...base,
      isPartialWindow: false,
      permissions: ["sleep_duration_minutes"],
      samples: [
        {
          id: "sleep-generic",
          metric: "sleep_duration_minutes",
          sleepValue: 1,
          startDate: "2026-08-22T23:00:00.000Z",
          endDate: "2026-08-23T07:00:00.000Z",
        },
        {
          id: "sleep-deep",
          metric: "sleep_duration_minutes",
          sleepValue: 4,
          startDate: "2026-08-23T00:00:00.000Z",
          endDate: "2026-08-23T02:00:00.000Z",
        },
      ],
    });

    expect(aggregate).toMatchObject({
      metric: "sleep_duration_minutes",
      value: 480,
      quality: "complete",
    });
  });
});

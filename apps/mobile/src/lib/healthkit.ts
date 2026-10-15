import type {
  HealthAggregateWriteInput,
  HealthPermission,
} from "@moodday/contracts";
/* eslint-disable no-await-in-loop -- HealthKit reads and SQLCipher writes are intentionally bounded and sequential to limit peak sensitive-data memory. */
import {
  WorkoutTypeIdentifier,
  isHealthDataAvailable,
  queryCategorySamples,
  queryQuantitySamples,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";
import { Platform } from "react-native";
import { api } from "./api";
import {
  deleteRawHealthSamples,
  storeRawHealthSamples,
  type HealthRawSampleRecord,
} from "./local-database";
import {
  aggregateHealthSamples,
  type LocalHealthSample,
} from "./healthkit-aggregation";

const quantityDefinitions = {
  step_count: {
    identifier: "HKQuantityTypeIdentifierStepCount",
    unit: "count",
  },
  active_energy_kcal: {
    identifier: "HKQuantityTypeIdentifierActiveEnergyBurned",
    unit: "kcal",
  },
  resting_heart_rate_bpm: {
    identifier: "HKQuantityTypeIdentifierRestingHeartRate",
    unit: "count/min",
  },
  hrv_sdnn_ms: {
    identifier: "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
    unit: "ms",
  },
} as const;

const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const healthKitIdentifiers = (permissions: readonly HealthPermission[]) => {
  const identifiers = permissions.flatMap((permission) => {
    if (permission === "sleep_duration_minutes") {
      return ["HKCategoryTypeIdentifierSleepAnalysis" as const];
    }
    if (permission === "workout_minutes") return [WorkoutTypeIdentifier];
    const definition = quantityDefinitions[permission];
    return [definition.identifier];
  });
  return [...new Set(identifiers)];
};

const serializeSample = (
  sample: LocalHealthSample,
  localDate: string,
): HealthRawSampleRecord => ({
  sampleType: sample.metric,
  sampleId: sample.id,
  localDate,
  observedAt: sample.endDate,
  payload: sample,
});

const readDay = async (
  permissions: readonly HealthPermission[],
  start: Date,
  end: Date,
) => {
  const filter = {
    date: { startDate: start, endDate: end, strictStartDate: true },
  };
  const rawSamples: LocalHealthSample[] = [];
  const aggregateSamples: LocalHealthSample[] = [];
  for (const permission of permissions) {
    if (permission === "sleep_duration_minutes") {
      // Attribute a sleep interval to the local day on which the user wakes up.
      // Querying from midnight would otherwise miss the part of a normal night
      // that started on the previous calendar day.
      const sleepQueryStart = new Date(start);
      sleepQueryStart.setHours(sleepQueryStart.getHours() - 18);
      const sleep = await queryCategorySamples(
        "HKCategoryTypeIdentifierSleepAnalysis",
        {
          filter: {
            date: {
              startDate: sleepQueryStart,
              endDate: end,
              strictStartDate: false,
            },
          },
          limit: 0,
          ascending: true,
        },
      );
      const mappedSleep = sleep
        .filter((sample) => {
          const wakeTime = new Date(sample.endDate);
          return wakeTime > start && wakeTime <= end;
        })
        .map((sample) => ({
          id: sample.uuid,
          metric: permission,
          startDate: new Date(sample.startDate).toISOString(),
          endDate: new Date(sample.endDate).toISOString(),
          sleepValue: sample.value,
          sourceName: sample.sourceRevision.source.name,
          deviceModel: sample.device?.model,
        }));
      rawSamples.push(...mappedSleep);
      aggregateSamples.push(...mappedSleep);
      continue;
    }
    if (permission === "workout_minutes") {
      const workouts = await queryWorkoutSamples({
        filter: { date: filter.date },
        limit: 0,
        ascending: true,
      });
      const mappedWorkouts = workouts.map((sample) => ({
        id: sample.uuid,
        metric: permission,
        startDate: new Date(sample.startDate).toISOString(),
        endDate: new Date(sample.endDate).toISOString(),
        value:
          (new Date(sample.endDate).getTime() -
            new Date(sample.startDate).getTime()) /
          60_000,
        sourceName: sample.sourceRevision.source.name,
        deviceModel: sample.device?.model,
      }));
      rawSamples.push(...mappedWorkouts);
      aggregateSamples.push(...mappedWorkouts);
      continue;
    }
    const definition = quantityDefinitions[permission];
    const quantitySamples = await queryQuantitySamples(definition.identifier, {
      filter,
      limit: 0,
      ascending: true,
      unit: definition.unit,
    });
    rawSamples.push(
      ...quantitySamples.map((sample) => ({
        id: sample.uuid,
        metric: permission,
        startDate: new Date(sample.startDate).toISOString(),
        endDate: new Date(sample.endDate).toISOString(),
        value: sample.quantity,
        sourceName: sample.sourceRevision.source.name,
        deviceModel: sample.device?.model,
      })),
    );
    const meanMetric =
      permission === "resting_heart_rate_bpm" || permission === "hrv_sdnn_ms";
    const statistic = await queryStatisticsForQuantity(
      definition.identifier,
      [meanMetric ? "discreteAverage" : "cumulativeSum"],
      { filter, unit: definition.unit },
    );
    const statisticValue = meanMetric
      ? statistic.averageQuantity?.quantity
      : statistic.sumQuantity?.quantity;
    if (statisticValue !== undefined) {
      aggregateSamples.push({
        id: `healthkit-statistic:${permission}:${start.toISOString()}`,
        metric: permission,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        value: statisticValue,
      });
    }
  }
  return { rawSamples, aggregateSamples };
};

export const isHealthKitAvailable = () =>
  Platform.OS === "ios" && isHealthDataAvailable();

export const requestHealthKitPermissions = async (
  permissions: readonly HealthPermission[],
) => {
  if (!isHealthKitAvailable()) return false;
  return requestAuthorization({ toRead: healthKitIdentifiers(permissions) });
};

export const synchronizeHealthKit = async ({
  ownerId,
  connectionId,
  permissions,
  days = 14,
}: {
  ownerId: string;
  connectionId: string;
  permissions: readonly HealthPermission[];
  days?: number;
}) => {
  if (!isHealthKitAvailable()) throw new Error("healthkit_unavailable");
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const aggregates: HealthAggregateWriteInput[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const start = startOfDay(day);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const queryEnd = end > now ? now : end;
    const localDate = toLocalDate(start);
    const { rawSamples, aggregateSamples } = await readDay(
      permissions,
      start,
      queryEnd,
    );
    await storeRawHealthSamples(
      ownerId,
      rawSamples.map((sample) => serializeSample(sample, localDate)),
    );
    aggregates.push(
      ...aggregateHealthSamples({
        connectionId,
        localDate,
        timezone,
        windowStart: start.toISOString(),
        windowEnd: queryEnd.toISOString(),
        permissions,
        samples: aggregateSamples,
        isPartialWindow: queryEnd < end,
      }),
    );
  }
  if (aggregates.length === 0) {
    return { accepted: 0, sourceConnectionId: connectionId } as const;
  }
  return api.importHealthAggregates({ aggregates });
};

export const deleteHealthKitData = async ({
  ownerId,
  connectionId,
  period,
}: {
  ownerId: string;
  connectionId: string;
  period?: { from?: string; to?: string };
}) => {
  const [serverDeleted, localDeleted] = await Promise.all([
    api.deleteHealthAggregates(connectionId, period),
    deleteRawHealthSamples(ownerId, period),
  ]);
  return { serverDeleted: serverDeleted.deleted, localDeleted };
};

import {
  getCivilWeekday,
  getDateKeyForTimeZone,
} from "@/lib/temporal/civil-date";
export { getDateKeyForTimeZone } from "@/lib/temporal/civil-date";

export type DoseSlotStatus = "pending" | "taken" | "skipped";

export type DoseSlotLabelKey =
  | "medication.doseSlot.once"
  | "medication.doseSlot.morning"
  | "medication.doseSlot.evening"
  | "medication.doseSlot.weekly";

export type ScheduledIntake = {
  id: string;
  takenAt: Date;
  skipped: boolean;
  scheduledForDate: string | null;
  doseIndex: number | null;
};

export type MedicationDoseSlot = {
  id: string;
  doseIndex: number;
  scheduledForDate: string;
  scheduledTime: string | null;
  labelKey: DoseSlotLabelKey;
  intake: ScheduledIntake | null;
  status: DoseSlotStatus;
};

type SchedulableMedication = {
  id: string;
  frequency: string;
  createdAt: Date;
  scheduleTimes?: string[];
  weeklyDay?: number | null;
  intakes: ScheduledIntake[];
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isValidScheduleTime = (time: string) => TIME_PATTERN.test(time);

export const getDefaultScheduleTimesForFrequency = (frequency: string) => {
  switch (frequency) {
    case "twice_daily":
      return ["09:00", "20:00"];
    case "weekly":
    case "daily":
      return ["09:00"];
    case "prn":
    default:
      return [];
  }
};

export const getExpectedDoseCountForFrequency = (frequency: string) => {
  switch (frequency) {
    case "twice_daily":
      return 2;
    case "weekly":
    case "daily":
      return 1;
    case "prn":
    default:
      return 0;
  }
};

export const normalizeScheduleTimesForFrequency = (
  frequency: string,
  scheduleTimes: string[] = [],
) => {
  const expectedDoseCount = getExpectedDoseCountForFrequency(frequency);
  if (expectedDoseCount === 0) return [];

  const defaults = getDefaultScheduleTimesForFrequency(frequency);
  const validTimes = scheduleTimes
    .map((time) => time.trim())
    .filter(isValidScheduleTime);

  return Array.from({ length: expectedDoseCount }, (_, index) => {
    const fallbackTime = defaults[index] || "09:00";
    return validTimes[index] || fallbackTime;
  });
};

export const normalizeWeeklyDay = (
  weeklyDay: number | null | undefined,
  fallbackDate = new Date(),
) => {
  if (
    typeof weeklyDay === "number" &&
    Number.isInteger(weeklyDay) &&
    weeklyDay >= 0 &&
    weeklyDay <= 6
  ) {
    return weeklyDay;
  }

  return getCivilWeekday(getDateKeyForTimeZone(fallbackDate));
};

export const isIntakeForDateInTimeZone = (
  intake: Pick<ScheduledIntake, "scheduledForDate" | "takenAt">,
  dateKey: string,
  timeZone: string,
) =>
  intake.scheduledForDate === dateKey ||
  (intake.scheduledForDate === null &&
    getDateKeyForTimeZone(intake.takenAt, timeZone) === dateKey);

export const getDoseDefinitionsForFrequency = (
  frequency: string,
  scheduleTimes: string[] = [],
) => {
  const normalizedTimes = normalizeScheduleTimesForFrequency(
    frequency,
    scheduleTimes,
  );

  switch (frequency) {
    case "twice_daily":
      return [
        {
          doseIndex: 0,
          labelKey: "medication.doseSlot.morning" as const,
          scheduledTime: normalizedTimes[0] ?? null,
        },
        {
          doseIndex: 1,
          labelKey: "medication.doseSlot.evening" as const,
          scheduledTime: normalizedTimes[1] ?? null,
        },
      ];
    case "weekly":
      return [
        {
          doseIndex: 0,
          labelKey: "medication.doseSlot.weekly" as const,
          scheduledTime: normalizedTimes[0] ?? null,
        },
      ];
    case "prn":
      return [];
    case "daily":
    default:
      return [
        {
          doseIndex: 0,
          labelKey: "medication.doseSlot.once" as const,
          scheduledTime: normalizedTimes[0] ?? null,
        },
      ];
  }
};

export const isWeeklyMedicationDueOnDate = (
  createdAt: Date,
  targetDate: string,
  weeklyDay?: number | null,
) => normalizeWeeklyDay(weeklyDay, createdAt) === getCivilWeekday(targetDate);

export const buildMedicationDoseSlots = (
  medication: SchedulableMedication,
  scheduledForDate = getDateKeyForTimeZone(),
) => {
  if (
    medication.frequency === "weekly" &&
    !isWeeklyMedicationDueOnDate(
      medication.createdAt,
      scheduledForDate,
      medication.weeklyDay,
    )
  ) {
    return [];
  }

  const intakesByDoseIndex = new Map<number, ScheduledIntake>();
  const sortedIntakes = [...medication.intakes].sort(
    (a, b) => b.takenAt.getTime() - a.takenAt.getTime(),
  );

  for (const intake of sortedIntakes) {
    const doseIndex = intake.doseIndex ?? 0;
    if (!intakesByDoseIndex.has(doseIndex)) {
      intakesByDoseIndex.set(doseIndex, intake);
    }
  }

  return getDoseDefinitionsForFrequency(
    medication.frequency,
    medication.scheduleTimes,
  ).map(({ doseIndex, labelKey, scheduledTime }): MedicationDoseSlot => {
    const intake = intakesByDoseIndex.get(doseIndex) ?? null;

    return {
      id: `${medication.id}:${scheduledForDate}:${doseIndex}`,
      doseIndex,
      scheduledForDate,
      scheduledTime,
      labelKey,
      intake,
      status: intake ? (intake.skipped ? "skipped" : "taken") : "pending",
    };
  });
};

export const createScheduledDoseKey = (
  medicationId: string,
  scheduledForDate: string,
  doseIndex: number,
) => `${medicationId}:${scheduledForDate}:${doseIndex}`;

export const hasOfflineDoseConflict = (
  existingClientOperationId: string | null | undefined,
  operationId: string,
) => existingClientOperationId !== operationId;

export const createMedicationReminderKey = (
  medicationId: string,
  scheduledForDate: string,
  doseIndex: number,
  scheduledTime: string | null,
) =>
  `${scheduledForDate}:${medicationId}:${doseIndex}:${scheduledTime ?? "time"}`;

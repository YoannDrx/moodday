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

const padDatePart = (value: number) => String(value).padStart(2, "0");
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

  return fallbackDate.getDay();
};

export const getLocalDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate(),
  )}`;

export const getDateKeyForTimeZone = (
  date = new Date(),
  timeZone?: string | null,
) => {
  if (!timeZone) return getLocalDateKey(date);

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) return getLocalDateKey(date);

    return `${year}-${month}-${day}`;
  } catch {
    return getLocalDateKey(date);
  }
};

export const isIntakeForDateInTimeZone = (
  intake: Pick<ScheduledIntake, "scheduledForDate" | "takenAt">,
  dateKey: string,
  timeZone: string,
) =>
  intake.scheduledForDate === dateKey ||
  (intake.scheduledForDate === null &&
    getDateKeyForTimeZone(intake.takenAt, timeZone) === dateKey);

export const parseDateKeyAsLocalDate = (dateKey: string) => {
  const [year = "0", month = "1", day = "1"] = dateKey.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

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
  targetDate: Date,
  weeklyDay?: number | null,
) => normalizeWeeklyDay(weeklyDay, createdAt) === targetDate.getDay();

export const buildMedicationDoseSlots = (
  medication: SchedulableMedication,
  scheduledForDate = getLocalDateKey(),
) => {
  const targetDate = parseDateKeyAsLocalDate(scheduledForDate);

  if (
    medication.frequency === "weekly" &&
    !isWeeklyMedicationDueOnDate(
      medication.createdAt,
      targetDate,
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

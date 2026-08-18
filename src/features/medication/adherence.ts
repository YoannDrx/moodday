import {
  enumerateCivilDateKeys,
  getCivilWeekday,
  getDateKeyForTimeZone,
} from "@/lib/temporal/civil-date";

export type MedicationIntakeForAdherence = {
  id?: string;
  scheduledForDate: string | null;
  doseIndex: number | null;
  skipped: boolean;
  takenAt?: Date;
};

export type MedicationScheduleForAdherence = {
  effectiveDate: string;
  frequency: string;
  weeklyDay: number | null;
  scheduleTimes: string[];
};

export type MedicationForAdherence = {
  id: string;
  frequency: string;
  isPRN?: boolean;
  startDate: string | null;
  endDate: string | null;
  weeklyDay: number | null;
  scheduleTimes: string[];
  intakes: MedicationIntakeForAdherence[];
  scheduleRevisions: MedicationScheduleForAdherence[];
};

export type MedicationAdherenceResult = {
  expectedDoses: number;
  takenDoses: number;
  percent: number | null;
};

export const getInclusiveDayCount = (
  start: Date,
  end: Date,
  timeZone?: string | null,
) =>
  enumerateCivilDateKeys(
    getDateKeyForTimeZone(start, timeZone),
    getDateKeyForTimeZone(end, timeZone),
  ).length;

export const getExpectedDosesForFrequency = (
  frequency: string,
  days: number,
) => {
  if (days <= 0 || frequency === "prn") return 0;
  switch (frequency) {
    case "twice_daily":
      return days * 2;
    case "weekly":
      return Math.ceil(days / 7);
    case "daily":
    default:
      return days;
  }
};

export const getExpectedDosesForMedications = (
  medications: { frequency: string }[],
  days: number,
) =>
  medications.reduce(
    (sum, medication) =>
      sum + getExpectedDosesForFrequency(medication.frequency, days),
    0,
  );

/** Legacy aggregate retained for old callers while they migrate to civil dates. */
export const calculateAdherencePercent = (
  medications: { frequency: string; intakes: unknown[] }[],
  days: number,
) => {
  const expected = getExpectedDosesForMedications(medications, days);
  const taken = medications.reduce(
    (sum, medication) => sum + medication.intakes.length,
    0,
  );
  return expected > 0
    ? Math.min(100, Math.round((taken / expected) * 100))
    : null;
};

const getScheduleForDate = (
  medication: MedicationForAdherence,
  dateKey: string,
) => {
  const applicableRevision = [...medication.scheduleRevisions]
    .filter((revision) => revision.effectiveDate <= dateKey)
    .sort((left, right) =>
      right.effectiveDate.localeCompare(left.effectiveDate),
    )
    .at(0);
  return (
    applicableRevision ?? {
      effectiveDate: medication.startDate ?? dateKey,
      frequency: medication.frequency,
      weeklyDay: medication.weeklyDay,
      scheduleTimes: medication.scheduleTimes,
    }
  );
};

const getExpectedDoseIndices = (
  schedule: MedicationScheduleForAdherence,
  dateKey: string,
) => {
  switch (schedule.frequency) {
    case "prn":
      return [];
    case "twice_daily":
      return [0, 1];
    case "weekly":
      return schedule.weeklyDay === getCivilWeekday(dateKey) ? [0] : [];
    case "daily":
    default:
      return [0];
  }
};

export const calculateMedicationAdherence = ({
  medications,
  startDate,
  endDate,
  todayDate,
}: {
  medications: MedicationForAdherence[];
  startDate: string;
  endDate: string;
  todayDate: string;
}): MedicationAdherenceResult => {
  const effectiveEndDate = endDate < todayDate ? endDate : todayDate;
  if (startDate > effectiveEndDate) {
    return { expectedDoses: 0, takenDoses: 0, percent: null };
  }

  let expectedDoses = 0;
  let takenDoses = 0;

  for (const medication of medications) {
    if (medication.isPRN || medication.frequency === "prn") continue;
    const medicationStart =
      medication.startDate && medication.startDate > startDate
        ? medication.startDate
        : startDate;
    const medicationEnd =
      medication.endDate && medication.endDate < effectiveEndDate
        ? medication.endDate
        : effectiveEndDate;
    if (medicationStart > medicationEnd) continue;

    const takenKeys = new Set(
      medication.intakes
        .filter(
          (intake) =>
            !intake.skipped &&
            intake.scheduledForDate !== null &&
            intake.scheduledForDate >= medicationStart &&
            intake.scheduledForDate <= medicationEnd,
        )
        .map((intake) => `${intake.scheduledForDate}:${intake.doseIndex ?? 0}`),
    );

    for (const dateKey of enumerateCivilDateKeys(
      medicationStart,
      medicationEnd,
    )) {
      const schedule = getScheduleForDate(medication, dateKey);
      for (const doseIndex of getExpectedDoseIndices(schedule, dateKey)) {
        expectedDoses += 1;
        if (takenKeys.has(`${dateKey}:${doseIndex}`)) takenDoses += 1;
      }
    }
  }

  return {
    expectedDoses,
    takenDoses,
    percent:
      expectedDoses === 0
        ? null
        : Math.min(100, Math.round((takenDoses / expectedDoses) * 100)),
  };
};

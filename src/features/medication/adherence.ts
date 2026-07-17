const DAY_IN_MS = 1000 * 60 * 60 * 24;

export type MedicationWithIntakes = {
  frequency: string;
  intakes: unknown[];
};

export const getInclusiveDayCount = (start: Date, end: Date) => {
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((endDay.getTime() - startDay.getTime()) / DAY_IN_MS) + 1);
};

export const getExpectedDosesForFrequency = (frequency: string, days: number) => {
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

export const calculateAdherencePercent = (
  medications: MedicationWithIntakes[],
  days: number,
) => {
  const expected = getExpectedDosesForMedications(medications, days);
  const taken = medications.reduce(
    (sum, medication) => sum + medication.intakes.length,
    0,
  );

  return expected > 0 ? Math.min(100, Math.round((taken / expected) * 100)) : null;
};

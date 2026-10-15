import type { MedicationDto } from "@moodday/contracts";

export type LocalReminderPreferences = {
  enabled: boolean;
  dailyCheckIn: boolean;
  dailyCheckInTime: string;
  medicationReminders: boolean;
};

export type PlannedLocalNotification = {
  identifier: string;
  kind: "daily_check_in" | "medication";
  route: "/" | "/(tabs)/soin";
  date: Date | null;
  hour: number;
  minute: number;
};

export const defaultLocalReminderPreferences: LocalReminderPreferences = {
  enabled: false,
  dailyCheckIn: true,
  dailyCheckInTime: "09:00",
  medicationReminders: true,
};

const parseTime = (value: string) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isMedicationActiveOn = (medication: MedicationDto, date: Date) => {
  const dateKey = localDateKey(date);
  return (
    !medication.isArchived &&
    !medication.isPrn &&
    (!medication.startDate || medication.startDate <= dateKey) &&
    (!medication.endDate || medication.endDate >= dateKey) &&
    (medication.frequency !== "weekly" ||
      medication.weeklyDay === date.getDay())
  );
};

const getScheduleTimes = (medication: MedicationDto) => {
  if (medication.scheduleTimes.length > 0) return medication.scheduleTimes;
  return medication.frequency === "twice_daily"
    ? ["09:00", "21:00"]
    : ["09:00"];
};

export const planLocalNotifications = ({
  medications,
  now,
  preferences,
  medicationHorizonDays = 30,
  maximumMedicationNotifications = 48,
}: {
  medications: MedicationDto[];
  now: Date;
  preferences: LocalReminderPreferences;
  medicationHorizonDays?: number;
  maximumMedicationNotifications?: number;
}): PlannedLocalNotification[] => {
  if (!preferences.enabled) return [];
  const planned: PlannedLocalNotification[] = [];
  if (preferences.dailyCheckIn) {
    const time = parseTime(preferences.dailyCheckInTime);
    if (time) {
      planned.push({
        identifier: "moodday-reminder-daily-check-in",
        kind: "daily_check_in",
        route: "/",
        date: null,
        ...time,
      });
    }
  }
  if (!preferences.medicationReminders) return planned;

  const reminderDates = new Map<string, Date>();
  for (let offset = 0; offset <= medicationHorizonDays; offset += 1) {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
    );
    for (const medication of medications) {
      if (!isMedicationActiveOn(medication, day)) continue;
      for (const timeValue of getScheduleTimes(medication)) {
        const time = parseTime(timeValue);
        if (!time) continue;
        const date = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          time.hour,
          time.minute,
        );
        if (date.getTime() <= now.getTime()) continue;
        reminderDates.set(`${localDateKey(day)}T${timeValue}`, date);
      }
    }
  }

  for (const [key, date] of Array.from(reminderDates.entries())
    .sort((left, right) => left[1].getTime() - right[1].getTime())
    .slice(0, maximumMedicationNotifications)) {
    planned.push({
      identifier: `moodday-reminder-medication-${key.replaceAll(":", "-")}`,
      kind: "medication",
      route: "/(tabs)/soin",
      date,
      hour: date.getHours(),
      minute: date.getMinutes(),
    });
  }
  return planned;
};

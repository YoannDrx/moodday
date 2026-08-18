export const REMINDER_WINDOW_MINUTES = 15;

export { getSafeTimeZone } from "@/lib/temporal/civil-date";

export const getLocalTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

export const isReminderDue = (localTime: string, reminderTime: string) => {
  const localMinutes = timeToMinutes(localTime);
  const reminderMinutes = timeToMinutes(reminderTime);
  if (localMinutes === null || reminderMinutes === null) return false;

  return (
    localMinutes >= reminderMinutes &&
    localMinutes < reminderMinutes + REMINDER_WINDOW_MINUTES
  );
};

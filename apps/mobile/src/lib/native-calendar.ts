import type { AppointmentDto } from "@moodday/contracts";
import {
  CalendarDialogResultActions,
  createEventInCalendarAsync,
  isAvailableAsync,
} from "expo-calendar";

export const presentNativeCalendarEvent = async (
  appointment: AppointmentDto,
) => {
  if (!(await isAvailableAsync())) throw new Error("calendar_unavailable");
  const startDate = new Date(appointment.startsAt);
  const endDate = appointment.endsAt
    ? new Date(appointment.endsAt)
    : new Date(startDate.getTime() + 60 * 60 * 1000);
  const result = await createEventInCalendarAsync({
    title: appointment.title,
    startDate,
    endDate,
    timeZone: appointment.timezone,
    location: appointment.location ?? undefined,
  });
  return {
    saved: result.action === CalendarDialogResultActions.saved,
    eventId: result.id,
  };
};

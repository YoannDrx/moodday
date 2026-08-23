import "server-only";

import type {
  CalendarConflictDto,
  ResolveCalendarConflictInput,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";
import {
  CalendarConnectionError,
  getGoogleCalendarAccessToken,
} from "./connection-service";
import {
  GoogleCalendarApiError,
  insertGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "./google-calendar-api";
import { recordPushedEvent, toGoogleEventWrite } from "./sync-service";

const conflictSelection = {
  id: true,
  connectionId: true,
  appointmentId: true,
  externalEventId: true,
  syncState: true,
  title: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  location: true,
  externalUpdatedAt: true,
  providerDeletedAt: true,
  conflictDetectedAt: true,
  appointment: {
    select: {
      title: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      location: true,
      updatedAt: true,
    },
  },
} as const;

const nonBlank = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized;
};

type SelectedConflict = Prisma.ExternalCalendarEventGetPayload<{
  select: typeof conflictSelection;
}>;

const toConflictDto = (conflict: SelectedConflict): CalendarConflictDto => ({
  id: conflict.id,
  connectionId: conflict.connectionId,
  appointmentId: conflict.appointmentId,
  externalEventId: conflict.externalEventId,
  syncState: conflict.syncState,
  moodDay: conflict.appointment
    ? {
        title: conflict.appointment.title,
        startsAt: conflict.appointment.startsAt.toISOString(),
        endsAt: conflict.appointment.endsAt?.toISOString() ?? null,
        timezone: conflict.appointment.timezone,
        location: conflict.appointment.location,
        updatedAt: conflict.appointment.updatedAt.toISOString(),
      }
    : null,
  google: {
    title: conflict.title,
    startsAt: conflict.startsAt?.toISOString() ?? null,
    endsAt: conflict.endsAt?.toISOString() ?? null,
    timezone: conflict.timezone,
    location: conflict.location,
    updatedAt: conflict.externalUpdatedAt?.toISOString() ?? null,
    deletedAt: conflict.providerDeletedAt?.toISOString() ?? null,
  },
  detectedAt: conflict.conflictDetectedAt?.toISOString() ?? null,
});

export const listCalendarConflicts = async (
  userId: string,
  connectionId: string,
) => {
  const rows = await prisma.externalCalendarEvent.findMany({
    where: {
      connectionId,
      syncState: "conflict",
      connection: { userId, revokedAt: null },
    },
    orderBy: { conflictDetectedAt: "desc" },
    select: conflictSelection,
  });
  return rows.map((row) => toConflictDto(row));
};

export const resolveCalendarConflict = async (
  userId: string,
  connectionId: string,
  conflictId: string,
  input: ResolveCalendarConflictInput,
) => {
  const conflict = await prisma.externalCalendarEvent.findFirst({
    where: {
      id: conflictId,
      connectionId,
      syncState: "conflict",
      connection: { userId, revokedAt: null },
    },
    include: { appointment: true, connection: true },
  });
  if (!conflict?.appointment) {
    throw new CalendarConnectionError("calendar_conflict_unavailable", false);
  }
  const { appointment, connection } = conflict;

  if (input.resolution === "google") {
    await prisma.$transaction(async (transaction) => {
      const next = await transaction.appointment.update({
        where: { id: appointment.id },
        data: conflict.providerDeletedAt
          ? { status: "cancelled" }
          : {
              startsAt: conflict.startsAt ?? appointment.startsAt,
              endsAt: conflict.endsAt,
              timezone: conflict.timezone ?? appointment.timezone,
              ...(connection.detailLevel === "appointment"
                ? {
                    title: nonBlank(conflict.title, appointment.title),
                    location: conflict.location,
                  }
                : {}),
              status:
                appointment.status === "cancelled"
                  ? "scheduled"
                  : appointment.status,
              externalEventId: conflict.externalEventId,
              externalVersion: conflict.externalVersion,
            },
      });
      await transaction.externalCalendarEvent.update({
        where: { id: conflict.id },
        data: {
          moodDayDigest: createPayloadDigest({
            title: next.title,
            startsAt: next.startsAt.toISOString(),
            endsAt: next.endsAt?.toISOString() ?? null,
            timezone: next.timezone,
            location: next.location,
            status: next.status,
          }),
          moodDayVersionAtSync: next.updatedAt,
          syncState: "aligned",
          conflictDetectedAt: null,
          lastSyncedAt: new Date(),
        },
      });
      return next;
    });
    const resolved = await prisma.externalCalendarEvent.findUniqueOrThrow({
      where: { id: conflict.id },
      select: conflictSelection,
    });
    return { conflict: toConflictDto(resolved), resolved: true };
  }

  if (
    !connection.googleAccountId ||
    !connection.externalCalendarId ||
    connection.provider !== "google"
  ) {
    throw new CalendarConnectionError("calendar_connection_unavailable", false);
  }
  const accessToken = await getGoogleCalendarAccessToken({
    userId,
    googleAccountId: connection.googleAccountId,
  });
  let event;
  try {
    event = conflict.providerDeletedAt
      ? await insertGoogleCalendarEvent({
          accessToken,
          calendarId: connection.externalCalendarId,
          event: toGoogleEventWrite(appointment, connection.detailLevel),
        })
      : await updateGoogleCalendarEvent({
          accessToken,
          calendarId: connection.externalCalendarId,
          eventId: conflict.externalEventId,
          externalVersion: conflict.externalVersion,
          event: toGoogleEventWrite(appointment, connection.detailLevel),
        });
  } catch (error) {
    if (error instanceof GoogleCalendarApiError && error.status === 412) {
      throw new CalendarConnectionError("calendar_conflict_changed_again");
    }
    throw error;
  }
  await recordPushedEvent({ connectionId, appointment, event });
  const resolved = await prisma.externalCalendarEvent.findUniqueOrThrow({
    where: {
      connectionId_appointmentId: {
        connectionId,
        appointmentId: appointment.id,
      },
    },
    select: conflictSelection,
  });
  return { conflict: toConflictDto(resolved), resolved: true };
};

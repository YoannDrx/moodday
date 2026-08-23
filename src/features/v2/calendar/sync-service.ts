import "server-only";

/* eslint-disable no-await-in-loop */

import { randomUUID } from "node:crypto";
import type { CalendarSyncResult } from "@moodday/contracts";
import type { Appointment, CalendarConnection } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";
import {
  CalendarConnectionError,
  getGoogleCalendarAccessToken,
} from "./connection-service";
import {
  deleteGoogleCalendarEvent,
  type GoogleCalendarEvent,
  type GoogleCalendarEventWrite,
  GoogleCalendarApiError,
  GoogleCalendarSyncTokenExpiredError,
  insertGoogleCalendarEvent,
  listGoogleCalendarEvents,
  updateGoogleCalendarEvent,
} from "./google-calendar-api";

const CURSOR_SCOPE = "google_calendar_events";
const SYNC_LEASE_MS = 5 * 60 * 1000;
const HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

type SyncConnection = CalendarConnection & {
  googleAccountId: string;
  externalCalendarId: string;
  sourceConnection: {
    id: string;
    status: "active" | "paused" | "permission_denied" | "revoked" | "error";
  };
};

const parseDate = (value: string | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const nonBlank = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized;
};

const getExternalSnapshot = (event: GoogleCalendarEvent) => ({
  title: event.summary ?? null,
  startsAt: parseDate(event.start?.dateTime),
  endsAt: parseDate(event.end?.dateTime),
  timezone: event.start?.timeZone ?? event.end?.timeZone ?? null,
  location: event.location ?? null,
  externalUpdatedAt: parseDate(event.updated),
  providerDeletedAt: event.status === "cancelled" ? new Date() : null,
});

const externalDigest = (event: GoogleCalendarEvent) =>
  createPayloadDigest({
    id: event.id,
    etag: event.etag ?? null,
    status: event.status ?? null,
    updated: event.updated ?? null,
    summary: event.summary ?? null,
    location: event.location ?? null,
    start: event.start ?? null,
    end: event.end ?? null,
  });

const moodDayDigest = (appointment: Appointment) =>
  createPayloadDigest({
    title: appointment.title,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt?.toISOString() ?? null,
    timezone: appointment.timezone,
    location: appointment.location,
    status: appointment.status,
  });

export const toGoogleEventWrite = (
  appointment: Appointment,
  detailLevel: "generic" | "appointment",
): GoogleCalendarEventWrite => ({
  summary:
    detailLevel === "appointment" ? appointment.title : "Rendez-vous Mood Day",
  ...(detailLevel === "appointment" && appointment.location
    ? { location: appointment.location }
    : {}),
  start: {
    dateTime: appointment.startsAt.toISOString(),
    timeZone: appointment.timezone,
  },
  end: {
    dateTime: (
      appointment.endsAt ??
      new Date(appointment.startsAt.getTime() + 60 * 60 * 1000)
    ).toISOString(),
    timeZone: appointment.timezone,
  },
  extendedProperties: {
    private: {
      moodDayAppointmentId: appointment.id,
      moodDayManaged: "true",
    },
  },
});

const getConnection = async (
  userId: string,
  connectionId: string,
): Promise<SyncConnection> => {
  const connection = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, userId, revokedAt: null },
    include: {
      sourceConnection: { select: { id: true, status: true } },
    },
  });
  if (
    !connection ||
    connection.provider !== "google" ||
    !connection.googleAccountId ||
    !connection.externalCalendarId
  ) {
    throw new CalendarConnectionError("calendar_connection_unavailable", false);
  }
  if (connection.sourceConnection.status !== "active") {
    throw new CalendarConnectionError("calendar_connection_not_active");
  }
  return {
    ...connection,
    googleAccountId: connection.googleAccountId,
    externalCalendarId: connection.externalCalendarId,
  };
};

const claimSyncLease = async (userId: string, connectionId: string) => {
  const now = new Date();
  const claimed = await prisma.calendarConnection.updateMany({
    where: {
      id: connectionId,
      userId,
      revokedAt: null,
      OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lt: now } }],
    },
    data: {
      syncLeaseUntil: new Date(now.getTime() + SYNC_LEASE_MS),
      lastSyncStartedAt: now,
      lastSyncErrorCode: null,
    },
  });
  if (claimed.count !== 1) {
    throw new CalendarConnectionError("calendar_sync_already_running");
  }
};

const importGoogleEvent = async ({
  userId,
  connection,
  event,
}: {
  userId: string;
  connection: SyncConnection;
  event: GoogleCalendarEvent;
}) => {
  const snapshot = getExternalSnapshot(event);
  if (!snapshot.startsAt || event.status === "cancelled") return null;
  const startsAt = snapshot.startsAt;
  const appointmentId = randomUUID();
  const operationId = `google-import:${createPayloadDigest({ connectionId: connection.id, eventId: event.id }).slice(0, 48)}`;
  return prisma.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.create({
      data: {
        id: appointmentId,
        userId,
        operationId,
        title: nonBlank(snapshot.title, "Rendez-vous"),
        startsAt,
        endsAt: snapshot.endsAt,
        timezone: snapshot.timezone ?? connection.timezone,
        location: snapshot.location,
        status: "scheduled",
        source: "google_calendar",
        externalEventId: event.id,
        externalVersion: event.etag ?? null,
      },
    });
    await transaction.externalCalendarEvent.create({
      data: {
        connectionId: connection.id,
        appointmentId: appointment.id,
        externalEventId: event.id,
        externalVersion: event.etag ?? null,
        externalUpdatedAt: snapshot.externalUpdatedAt,
        externalDigest: externalDigest(event),
        moodDayDigest: moodDayDigest(appointment),
        moodDayVersionAtSync: appointment.updatedAt,
        title: snapshot.title,
        startsAt: snapshot.startsAt,
        endsAt: snapshot.endsAt,
        timezone: snapshot.timezone,
        location: snapshot.location,
        providerDeletedAt: null,
        lastSyncedAt: new Date(),
      },
    });
    return appointment;
  });
};

const applyGoogleChange = async ({
  userId,
  connection,
  event,
}: {
  userId: string;
  connection: SyncConnection;
  event: GoogleCalendarEvent;
}) => {
  let mapping = await prisma.externalCalendarEvent.findUnique({
    where: {
      connectionId_externalEventId: {
        connectionId: connection.id,
        externalEventId: event.id,
      },
    },
    include: { appointment: true },
  });

  const linkedAppointmentId =
    event.extendedProperties?.private?.moodDayAppointmentId;
  if (!mapping && linkedAppointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: linkedAppointmentId, userId },
    });
    if (appointment) {
      const snapshot = getExternalSnapshot(event);
      mapping = await prisma.externalCalendarEvent.create({
        data: {
          connectionId: connection.id,
          appointmentId: appointment.id,
          externalEventId: event.id,
          externalVersion: event.etag ?? null,
          externalUpdatedAt: snapshot.externalUpdatedAt,
          externalDigest: externalDigest(event),
          moodDayDigest: moodDayDigest(appointment),
          moodDayVersionAtSync: appointment.updatedAt,
          title: snapshot.title,
          startsAt: snapshot.startsAt,
          endsAt: snapshot.endsAt,
          timezone: snapshot.timezone,
          location: snapshot.location,
          providerDeletedAt: snapshot.providerDeletedAt,
          lastSyncedAt: new Date(),
        },
        include: { appointment: true },
      });
    }
  }

  if (!mapping) {
    const imported = await importGoogleEvent({ userId, connection, event });
    return imported ? "imported" : "ignored";
  }
  const appointment = mapping.appointment;
  if (!appointment) return "ignored";

  const eventDigest = externalDigest(event);
  const providerChanged = mapping.externalDigest !== eventDigest;
  if (!providerChanged) return "ignored";
  const localChanged =
    !mapping.moodDayVersionAtSync ||
    appointment.updatedAt.getTime() > mapping.moodDayVersionAtSync.getTime();
  const snapshot = getExternalSnapshot(event);

  if (localChanged) {
    await prisma.externalCalendarEvent.update({
      where: { id: mapping.id },
      data: {
        externalVersion: event.etag ?? null,
        externalUpdatedAt: snapshot.externalUpdatedAt,
        externalDigest: eventDigest,
        title: snapshot.title,
        startsAt: snapshot.startsAt,
        endsAt: snapshot.endsAt,
        timezone: snapshot.timezone,
        location: snapshot.location,
        providerDeletedAt: snapshot.providerDeletedAt,
        syncState: "conflict",
        conflictDetectedAt: new Date(),
      },
    });
    return "conflict";
  }

  await prisma.$transaction(async (transaction) => {
    const next = await transaction.appointment.update({
      where: { id: appointment.id },
      data:
        event.status === "cancelled"
          ? {
              status: "cancelled",
              externalVersion: event.etag ?? null,
            }
          : {
              startsAt: snapshot.startsAt ?? appointment.startsAt,
              endsAt: snapshot.endsAt,
              timezone: snapshot.timezone ?? appointment.timezone,
              ...(connection.detailLevel === "appointment"
                ? {
                    title: nonBlank(snapshot.title, appointment.title),
                    location: snapshot.location,
                  }
                : {}),
              status:
                appointment.status === "cancelled"
                  ? "scheduled"
                  : appointment.status,
              externalVersion: event.etag ?? null,
            },
    });
    await transaction.externalCalendarEvent.update({
      where: { id: mapping.id },
      data: {
        externalVersion: event.etag ?? null,
        externalUpdatedAt: snapshot.externalUpdatedAt,
        externalDigest: eventDigest,
        moodDayDigest: moodDayDigest(next),
        moodDayVersionAtSync: next.updatedAt,
        title: snapshot.title,
        startsAt: snapshot.startsAt,
        endsAt: snapshot.endsAt,
        timezone: snapshot.timezone,
        location: snapshot.location,
        providerDeletedAt: snapshot.providerDeletedAt,
        syncState: "aligned",
        conflictDetectedAt: null,
        lastSyncedAt: new Date(),
      },
    });
  });
  return "updated";
};

const reconcileMissingGoogleEvents = async ({
  connectionId,
  seenExternalEventIds,
}: {
  connectionId: string;
  seenExternalEventIds: Set<string>;
}) => {
  const mappings = await prisma.externalCalendarEvent.findMany({
    where: { connectionId, providerDeletedAt: null },
    include: { appointment: true },
  });
  let updated = 0;
  let conflicts = 0;
  for (const mapping of mappings) {
    if (seenExternalEventIds.has(mapping.externalEventId)) continue;
    const appointment = mapping.appointment;
    if (!appointment) {
      await prisma.externalCalendarEvent.update({
        where: { id: mapping.id },
        data: {
          providerDeletedAt: new Date(),
          syncState: "provider_deleted",
          lastSyncedAt: new Date(),
        },
      });
      continue;
    }
    const localChanged =
      !mapping.moodDayVersionAtSync ||
      appointment.updatedAt.getTime() > mapping.moodDayVersionAtSync.getTime();
    if (localChanged && appointment.status !== "cancelled") {
      await prisma.externalCalendarEvent.update({
        where: { id: mapping.id },
        data: {
          providerDeletedAt: new Date(),
          syncState: "conflict",
          conflictDetectedAt: new Date(),
        },
      });
      conflicts += 1;
      continue;
    }
    await prisma.$transaction(async (transaction) => {
      const next = await transaction.appointment.update({
        where: { id: appointment.id },
        data: { status: "cancelled" },
      });
      await transaction.externalCalendarEvent.update({
        where: { id: mapping.id },
        data: {
          providerDeletedAt: new Date(),
          moodDayDigest: moodDayDigest(next),
          moodDayVersionAtSync: next.updatedAt,
          syncState: "aligned",
          conflictDetectedAt: null,
          lastSyncedAt: new Date(),
        },
      });
    });
    updated += 1;
  }
  return { updated, conflicts };
};

export const recordPushedEvent = async ({
  connectionId,
  appointment,
  event,
}: {
  connectionId: string;
  appointment: Appointment;
  event: GoogleCalendarEvent;
}) => {
  const snapshot = getExternalSnapshot(event);
  await prisma.$transaction(async (transaction) => {
    const updatedAppointment = await transaction.appointment.update({
      where: { id: appointment.id },
      data: {
        externalEventId: event.id,
        externalVersion: event.etag ?? null,
      },
    });
    await transaction.externalCalendarEvent.upsert({
      where: {
        connectionId_appointmentId: {
          connectionId,
          appointmentId: appointment.id,
        },
      },
      create: {
        connectionId,
        appointmentId: appointment.id,
        externalEventId: event.id,
        externalVersion: event.etag ?? null,
        externalUpdatedAt: snapshot.externalUpdatedAt,
        externalDigest: externalDigest(event),
        moodDayDigest: moodDayDigest(updatedAppointment),
        moodDayVersionAtSync: updatedAppointment.updatedAt,
        title: snapshot.title,
        startsAt: snapshot.startsAt,
        endsAt: snapshot.endsAt,
        timezone: snapshot.timezone,
        location: snapshot.location,
        lastSyncedAt: new Date(),
      },
      update: {
        externalEventId: event.id,
        externalVersion: event.etag ?? null,
        externalUpdatedAt: snapshot.externalUpdatedAt,
        externalDigest: externalDigest(event),
        moodDayDigest: moodDayDigest(updatedAppointment),
        moodDayVersionAtSync: updatedAppointment.updatedAt,
        title: snapshot.title,
        startsAt: snapshot.startsAt,
        endsAt: snapshot.endsAt,
        timezone: snapshot.timezone,
        location: snapshot.location,
        providerDeletedAt: null,
        syncState: "aligned",
        conflictDetectedAt: null,
        lastSyncedAt: new Date(),
      },
    });
  });
};

export const synchronizeGoogleCalendar = async (
  userId: string,
  connectionId: string,
): Promise<CalendarSyncResult> => {
  await claimSyncLease(userId, connectionId);
  let fullSync = false;
  try {
    const connection = await getConnection(userId, connectionId);
    const accessToken = await getGoogleCalendarAccessToken({
      userId,
      googleAccountId: connection.googleAccountId,
    });
    const cursor = await prisma.syncCursor.findUnique({
      where: {
        sourceConnectionId_scope: {
          sourceConnectionId: connection.sourceConnectionId,
          scope: CURSOR_SCOPE,
        },
      },
    });

    let providerPage: Awaited<ReturnType<typeof listGoogleCalendarEvents>>;
    try {
      fullSync = !cursor?.cursor;
      providerPage = await listGoogleCalendarEvents({
        accessToken,
        calendarId: connection.externalCalendarId,
        syncToken: cursor?.cursor,
      });
    } catch (error) {
      if (!(error instanceof GoogleCalendarSyncTokenExpiredError) || !cursor) {
        throw error;
      }
      fullSync = true;
      await prisma.syncCursor.update({
        where: { id: cursor.id },
        data: { cursor: null, invalidatedAt: new Date() },
      });
      providerPage = await listGoogleCalendarEvents({
        accessToken,
        calendarId: connection.externalCalendarId,
      });
    }

    let imported = 0;
    let updatedFromGoogle = 0;
    let conflicts = 0;
    for (const event of providerPage.events) {
      const outcome = await applyGoogleChange({ userId, connection, event });
      if (outcome === "imported") imported += 1;
      if (outcome === "updated") updatedFromGoogle += 1;
      if (outcome === "conflict") conflicts += 1;
    }
    if (fullSync) {
      const reconciliation = await reconcileMissingGoogleEvents({
        connectionId: connection.id,
        seenExternalEventIds: new Set(
          providerPage.events.map((event) => event.id),
        ),
      });
      updatedFromGoogle += reconciliation.updated;
      conflicts += reconciliation.conflicts;
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        startsAt: { gte: new Date(Date.now() - HISTORY_WINDOW_MS) },
      },
      orderBy: { startsAt: "asc" },
    });
    const mappings = await prisma.externalCalendarEvent.findMany({
      where: { connectionId: connection.id, appointmentId: { not: null } },
    });
    const byAppointment = new Map(
      mappings.flatMap((mapping) =>
        mapping.appointmentId
          ? ([[mapping.appointmentId, mapping]] as const)
          : [],
      ),
    );
    let pushedToGoogle = 0;

    for (const appointment of appointments) {
      const mapping = byAppointment.get(appointment.id);
      if (mapping?.syncState === "conflict") continue;
      if (!mapping) {
        if (appointment.status === "cancelled") continue;
        const event = await insertGoogleCalendarEvent({
          accessToken,
          calendarId: connection.externalCalendarId,
          event: toGoogleEventWrite(appointment, connection.detailLevel),
        });
        await recordPushedEvent({
          connectionId: connection.id,
          appointment,
          event,
        });
        pushedToGoogle += 1;
        continue;
      }

      const localChanged =
        !mapping.moodDayVersionAtSync ||
        appointment.updatedAt.getTime() >
          mapping.moodDayVersionAtSync.getTime();
      if (!localChanged) continue;
      if (mapping.providerDeletedAt && appointment.status !== "cancelled") {
        await prisma.externalCalendarEvent.update({
          where: { id: mapping.id },
          data: { syncState: "conflict", conflictDetectedAt: new Date() },
        });
        conflicts += 1;
        continue;
      }
      try {
        if (appointment.status === "cancelled") {
          await deleteGoogleCalendarEvent({
            accessToken,
            calendarId: connection.externalCalendarId,
            eventId: mapping.externalEventId,
            externalVersion: mapping.externalVersion,
          });
          await prisma.externalCalendarEvent.update({
            where: { id: mapping.id },
            data: {
              providerDeletedAt: new Date(),
              moodDayDigest: moodDayDigest(appointment),
              moodDayVersionAtSync: appointment.updatedAt,
              syncState: "aligned",
              lastSyncedAt: new Date(),
            },
          });
        } else {
          const event = await updateGoogleCalendarEvent({
            accessToken,
            calendarId: connection.externalCalendarId,
            eventId: mapping.externalEventId,
            externalVersion: mapping.externalVersion,
            event: toGoogleEventWrite(appointment, connection.detailLevel),
          });
          await recordPushedEvent({
            connectionId: connection.id,
            appointment,
            event,
          });
        }
        pushedToGoogle += 1;
      } catch (error) {
        if (error instanceof GoogleCalendarApiError && error.status === 412) {
          await prisma.externalCalendarEvent.update({
            where: { id: mapping.id },
            data: { syncState: "conflict", conflictDetectedAt: new Date() },
          });
          conflicts += 1;
          continue;
        }
        throw error;
      }
    }

    const completedAt = new Date();
    await prisma.$transaction([
      prisma.syncCursor.upsert({
        where: {
          sourceConnectionId_scope: {
            sourceConnectionId: connection.sourceConnectionId,
            scope: CURSOR_SCOPE,
          },
        },
        create: {
          sourceConnectionId: connection.sourceConnectionId,
          scope: CURSOR_SCOPE,
          cursor: providerPage.nextSyncToken,
          lastFullSyncAt: fullSync ? completedAt : null,
        },
        update: {
          cursor: providerPage.nextSyncToken,
          invalidatedAt: null,
          ...(fullSync ? { lastFullSyncAt: completedAt } : {}),
        },
      }),
      prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          syncLeaseUntil: null,
          lastSyncCompletedAt: completedAt,
          lastSyncErrorCode: null,
        },
      }),
      prisma.sourceConnection.update({
        where: { id: connection.sourceConnectionId },
        data: { status: "active", lastSyncedAt: completedAt },
      }),
    ]);
    return {
      connectionId,
      fullSync,
      imported,
      updatedFromGoogle,
      pushedToGoogle,
      conflicts,
      completedAt: completedAt.toISOString(),
    };
  } catch (error) {
    const code =
      error instanceof CalendarConnectionError
        ? error.code
        : error instanceof GoogleCalendarApiError
          ? `google_calendar_${error.code}`
          : "google_calendar_sync_failed";
    const permissionFailure =
      error instanceof GoogleCalendarApiError &&
      (error.status === 401 || error.status === 403);
    await prisma.calendarConnection.updateMany({
      where: { id: connectionId, userId },
      data: {
        syncLeaseUntil: null,
        lastSyncErrorCode: code,
      },
    });
    if (permissionFailure) {
      await prisma.sourceConnection.updateMany({
        where: {
          userId,
          calendarConnection: { is: { id: connectionId } },
        },
        data: { status: "permission_denied" },
      });
    }
    throw error instanceof CalendarConnectionError
      ? error
      : new CalendarConnectionError(code);
  }
};

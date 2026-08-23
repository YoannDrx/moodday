import { prisma } from "@/lib/prisma";
import type * as GoogleCalendarApi from "@/features/v2/calendar/google-calendar-api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/v2/calendar/connection-service", () => {
  class CalendarConnectionError extends Error {
    readonly code: string;
    readonly recoverable: boolean;

    constructor(code: string, recoverable = true) {
      super(code);
      this.code = code;
      this.recoverable = recoverable;
    }
  }
  return { CalendarConnectionError, getGoogleCalendarAccessToken: vi.fn() };
});
vi.mock("@/features/v2/calendar/google-calendar-api", async () => {
  const actual = await vi.importActual<typeof GoogleCalendarApi>(
    "@/features/v2/calendar/google-calendar-api",
  );
  return {
    ...actual,
    listGoogleCalendarEvents: vi.fn(),
    insertGoogleCalendarEvent: vi.fn(),
    updateGoogleCalendarEvent: vi.fn(),
    deleteGoogleCalendarEvent: vi.fn(),
  };
});

import { getGoogleCalendarAccessToken } from "@/features/v2/calendar/connection-service";
import {
  GoogleCalendarSyncTokenExpiredError,
  insertGoogleCalendarEvent,
  listGoogleCalendarEvents,
} from "@/features/v2/calendar/google-calendar-api";
import {
  synchronizeGoogleCalendar,
  toGoogleEventWrite,
} from "@/features/v2/calendar/sync-service";

const timestamp = new Date("2026-08-23T08:00:00.000Z");
const connection = {
  id: "calendar-connection-1",
  userId: "user-1",
  sourceConnectionId: "source-connection-1",
  operationId: "operation-calendar-1",
  provider: "google",
  googleAccountId: "google-account-1",
  externalCalendarId: "google-calendar-1",
  displayName: "Mood Day",
  timezone: "Europe/Paris",
  detailLevel: "generic",
  syncLeaseUntil: null,
  lastSyncStartedAt: null,
  lastSyncCompletedAt: null,
  lastSyncErrorCode: null,
  revokedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  sourceConnection: { id: "source-connection-1", status: "active" },
};
const appointment = {
  id: "appointment-1",
  userId: "user-1",
  clinicianId: null,
  operationId: "appointment-operation-1",
  title: "Suivi psychiatrique privé",
  startsAt: new Date("2026-08-25T08:00:00.000Z"),
  endsAt: new Date("2026-08-25T09:00:00.000Z"),
  timezone: "Europe/Paris",
  location: "Cabinet confidentiel",
  status: "scheduled",
  source: "moodday",
  externalEventId: null,
  externalVersion: null,
  preparationStatus: "not_started",
  createdAt: timestamp,
  updatedAt: timestamp,
};

describe("V2 Google Calendar synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.calendarConnection.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.calendarConnection.findFirst).mockResolvedValue(
      connection as never,
    );
    vi.mocked(getGoogleCalendarAccessToken).mockResolvedValue("access-token");
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.externalCalendarEvent.findMany).mockResolvedValue([]);
    vi.mocked(prisma.syncCursor.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.calendarConnection.update).mockResolvedValue({} as never);
    vi.mocked(prisma.sourceConnection.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (input) => {
      if (Array.isArray(input)) return Promise.all(input) as never;
      return input(prisma) as never;
    });
  });

  it("invalidates an expired syncToken and completes a full resynchronization", async () => {
    vi.mocked(prisma.syncCursor.findUnique).mockResolvedValue({
      id: "cursor-1",
      sourceConnectionId: "source-connection-1",
      scope: "google_calendar_events",
      cursor: "expired-sync-token",
      invalidatedAt: null,
      lastFullSyncAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    vi.mocked(prisma.syncCursor.update).mockResolvedValue({} as never);
    vi.mocked(listGoogleCalendarEvents)
      .mockRejectedValueOnce(new GoogleCalendarSyncTokenExpiredError())
      .mockResolvedValueOnce({ events: [], nextSyncToken: "fresh-sync-token" });

    await expect(
      synchronizeGoogleCalendar("user-1", "calendar-connection-1"),
    ).resolves.toMatchObject({
      fullSync: true,
      imported: 0,
      conflicts: 0,
    });
    expect(prisma.syncCursor.update).toHaveBeenCalledWith({
      where: { id: "cursor-1" },
      data: { cursor: null, invalidatedAt: expect.any(Date) },
    });
    expect(listGoogleCalendarEvents).toHaveBeenNthCalledWith(2, {
      accessToken: "access-token",
      calendarId: "google-calendar-1",
    });
    expect(prisma.syncCursor.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ cursor: "fresh-sync-token" }),
      }),
    );
  });

  it("freezes concurrent Google and Mood Day edits as an explicit conflict", async () => {
    vi.mocked(prisma.syncCursor.findUnique).mockResolvedValue({
      id: "cursor-1",
      sourceConnectionId: "source-connection-1",
      scope: "google_calendar_events",
      cursor: "sync-token",
      invalidatedAt: null,
      lastFullSyncAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    vi.mocked(listGoogleCalendarEvents).mockResolvedValue({
      events: [
        {
          id: "google-event-1",
          etag: '"google-version-2"',
          status: "confirmed",
          updated: "2026-08-23T08:10:00.000Z",
          summary: "Changed in Google",
          start: {
            dateTime: "2026-08-25T10:00:00.000Z",
            timeZone: "Europe/Paris",
          },
          end: {
            dateTime: "2026-08-25T11:00:00.000Z",
            timeZone: "Europe/Paris",
          },
        },
      ],
      nextSyncToken: "next-sync-token",
    });
    vi.mocked(prisma.externalCalendarEvent.findUnique).mockResolvedValue({
      id: "mapping-1",
      connectionId: "calendar-connection-1",
      appointmentId: "appointment-1",
      externalEventId: "google-event-1",
      externalVersion: '"google-version-1"',
      externalUpdatedAt: timestamp,
      externalDigest: "previous-google-digest",
      moodDayDigest: "previous-moodday-digest",
      moodDayVersionAtSync: new Date("2026-08-23T07:00:00.000Z"),
      title: "Old title",
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      timezone: appointment.timezone,
      location: appointment.location,
      syncState: "aligned",
      conflictDetectedAt: null,
      providerDeletedAt: null,
      lastSyncedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      appointment,
    } as never);
    vi.mocked(prisma.externalCalendarEvent.update).mockResolvedValue({} as never);
    vi.mocked(prisma.externalCalendarEvent.findMany).mockResolvedValue([
      {
        id: "mapping-1",
        connectionId: "calendar-connection-1",
        appointmentId: "appointment-1",
        syncState: "conflict",
      },
    ] as never);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([
      appointment as never,
    ]);

    await expect(
      synchronizeGoogleCalendar("user-1", "calendar-connection-1"),
    ).resolves.toMatchObject({ conflicts: 1, updatedFromGoogle: 0 });
    expect(prisma.appointment.update).not.toHaveBeenCalled();
    expect(prisma.externalCalendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "mapping-1" },
        data: expect.objectContaining({ syncState: "conflict" }),
      }),
    );
  });

  it("keeps private appointment details out of generic Google events", async () => {
    expect(toGoogleEventWrite(appointment as never, "generic")).toEqual({
      summary: "Rendez-vous Mood Day",
      start: {
        dateTime: "2026-08-25T08:00:00.000Z",
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: "2026-08-25T09:00:00.000Z",
        timeZone: "Europe/Paris",
      },
      extendedProperties: {
        private: {
          moodDayAppointmentId: "appointment-1",
          moodDayManaged: "true",
        },
      },
    });
    expect(JSON.stringify(toGoogleEventWrite(appointment as never, "generic"))).not.toContain(
      "psychiatrique",
    );
    expect(insertGoogleCalendarEvent).not.toHaveBeenCalled();
  });

  it("reconciles an event missing from a full snapshot when no local edit is pending", async () => {
    vi.mocked(prisma.syncCursor.findUnique).mockResolvedValue(null);
    vi.mocked(listGoogleCalendarEvents).mockResolvedValue({
      events: [],
      nextSyncToken: "full-sync-token",
    });
    const mapping = {
      id: "mapping-1",
      connectionId: "calendar-connection-1",
      appointmentId: "appointment-1",
      externalEventId: "missing-google-event",
      moodDayVersionAtSync: timestamp,
      providerDeletedAt: null,
      appointment,
    };
    vi.mocked(prisma.externalCalendarEvent.findMany)
      .mockResolvedValueOnce([mapping] as never)
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.update).mockResolvedValue({
      ...appointment,
      status: "cancelled",
      updatedAt: new Date("2026-08-23T08:05:00.000Z"),
    } as never);
    vi.mocked(prisma.externalCalendarEvent.update).mockResolvedValue({} as never);

    await expect(
      synchronizeGoogleCalendar("user-1", "calendar-connection-1"),
    ).resolves.toMatchObject({
      fullSync: true,
      updatedFromGoogle: 1,
      conflicts: 0,
    });
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appointment-1" },
      data: { status: "cancelled" },
    });
    expect(prisma.externalCalendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "mapping-1" },
        data: expect.objectContaining({
          providerDeletedAt: expect.any(Date),
          syncState: "aligned",
        }),
      }),
    );
  });
});

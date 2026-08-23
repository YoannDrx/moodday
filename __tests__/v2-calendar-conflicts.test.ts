import { prisma } from "@/lib/prisma";
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
vi.mock("@/features/v2/calendar/google-calendar-api", () => {
  class GoogleCalendarApiError extends Error {
    readonly status: number;
    readonly code: string;

    constructor(status: number, code: string) {
      super(code);
      this.status = status;
      this.code = code;
    }
  }
  return {
    GoogleCalendarApiError,
    insertGoogleCalendarEvent: vi.fn(),
    updateGoogleCalendarEvent: vi.fn(),
  };
});
vi.mock("@/features/v2/calendar/sync-service", () => ({
  recordPushedEvent: vi.fn(),
  toGoogleEventWrite: vi.fn(() => ({ summary: "Rendez-vous Mood Day" })),
}));

import { resolveCalendarConflict } from "@/features/v2/calendar/conflict-service";
import { getGoogleCalendarAccessToken } from "@/features/v2/calendar/connection-service";
import {
  GoogleCalendarApiError,
  updateGoogleCalendarEvent,
} from "@/features/v2/calendar/google-calendar-api";

const initial = new Date("2026-08-23T08:00:00.000Z");
const appointment = {
  id: "appointment-1",
  userId: "user-1",
  clinicianId: null,
  operationId: "operation-appointment-1",
  title: "Titre privé Mood Day",
  startsAt: new Date("2026-08-25T08:00:00.000Z"),
  endsAt: new Date("2026-08-25T09:00:00.000Z"),
  timezone: "Europe/Paris",
  location: "Lieu privé",
  status: "scheduled",
  source: "moodday",
  externalEventId: "google-event-1",
  externalVersion: '"version-1"',
  preparationStatus: "not_started",
  createdAt: initial,
  updatedAt: initial,
};
const conflict = {
  id: "conflict-1",
  connectionId: "connection-1",
  appointmentId: "appointment-1",
  externalEventId: "google-event-1",
  externalVersion: '"version-2"',
  externalUpdatedAt: new Date("2026-08-23T08:05:00.000Z"),
  externalDigest: "external-digest",
  moodDayDigest: "moodday-digest",
  moodDayVersionAtSync: initial,
  title: "Titre Google",
  startsAt: new Date("2026-08-25T10:00:00.000Z"),
  endsAt: new Date("2026-08-25T11:00:00.000Z"),
  timezone: "Europe/Paris",
  location: "Lieu Google",
  syncState: "conflict",
  conflictDetectedAt: new Date("2026-08-23T08:06:00.000Z"),
  providerDeletedAt: null,
  lastSyncedAt: initial,
  createdAt: initial,
  updatedAt: initial,
  appointment,
  connection: {
    id: "connection-1",
    userId: "user-1",
    provider: "google",
    detailLevel: "generic",
    googleAccountId: "google-account-1",
    externalCalendarId: "google-calendar-1",
    revokedAt: null,
  },
};

const resolvedSelection = {
  id: "conflict-1",
  connectionId: "connection-1",
  appointmentId: "appointment-1",
  externalEventId: "google-event-1",
  syncState: "aligned",
  title: "Titre Google",
  startsAt: conflict.startsAt,
  endsAt: conflict.endsAt,
  timezone: "Europe/Paris",
  location: "Lieu Google",
  externalUpdatedAt: conflict.externalUpdatedAt,
  providerDeletedAt: null,
  conflictDetectedAt: null,
  appointment: {
    title: appointment.title,
    startsAt: conflict.startsAt,
    endsAt: conflict.endsAt,
    timezone: "Europe/Paris",
    location: appointment.location,
    updatedAt: new Date("2026-08-23T08:07:00.000Z"),
  },
};

describe("V2 calendar conflict resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.externalCalendarEvent.findFirst).mockResolvedValue(
      conflict as never,
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointment.update).mockResolvedValue({
      ...appointment,
      startsAt: conflict.startsAt,
      endsAt: conflict.endsAt,
      updatedAt: resolvedSelection.appointment.updatedAt,
    } as never);
    vi.mocked(prisma.externalCalendarEvent.update).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.externalCalendarEvent.findUniqueOrThrow).mockResolvedValue(
      resolvedSelection as never,
    );
    vi.mocked(getGoogleCalendarAccessToken).mockResolvedValue("access-token");
  });

  it("keeps the Google time while preserving private title and location in generic mode", async () => {
    await expect(
      resolveCalendarConflict("user-1", "connection-1", "conflict-1", {
        resolution: "google",
      }),
    ).resolves.toMatchObject({
      resolved: true,
      conflict: { syncState: "aligned" },
    });
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appointment-1" },
      data: expect.objectContaining({
        startsAt: conflict.startsAt,
        endsAt: conflict.endsAt,
        externalVersion: '"version-2"',
      }),
    });
    const updateData = vi.mocked(prisma.appointment.update).mock.calls[0]?.[0]
      ?.data;
    expect(updateData).not.toHaveProperty("title");
    expect(updateData).not.toHaveProperty("location");
    expect(prisma.externalCalendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          syncState: "aligned",
          conflictDetectedAt: null,
        }),
      }),
    );
  });

  it("reports a concurrent edit only when Google rejects the version precondition", async () => {
    vi.mocked(updateGoogleCalendarEvent).mockRejectedValue(
      new GoogleCalendarApiError(412, "conditionNotMet"),
    );

    await expect(
      resolveCalendarConflict("user-1", "connection-1", "conflict-1", {
        resolution: "moodday",
      }),
    ).rejects.toMatchObject({ code: "calendar_conflict_changed_again" });
  });

  it("does not disguise a provider outage as another concurrent edit", async () => {
    const outage = new Error("provider unavailable");
    vi.mocked(updateGoogleCalendarEvent).mockRejectedValue(outage);

    await expect(
      resolveCalendarConflict("user-1", "connection-1", "conflict-1", {
        resolution: "moodday",
      }),
    ).rejects.toBe(outage);
  });
});

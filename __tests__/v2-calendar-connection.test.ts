import { prisma } from "@/lib/prisma";
import type * as GoogleCalendarApi from "@/features/v2/calendar/google-calendar-api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getAccessToken: vi.fn() } },
}));
vi.mock("@/lib/features/availability", () => ({
  getFeatureAvailability: vi.fn(() => ({
    enabled: true,
    reason: "available",
  })),
}));
vi.mock("@/features/v2/calendar/google-calendar-api", async () => {
  const actual = await vi.importActual<typeof GoogleCalendarApi>(
    "@/features/v2/calendar/google-calendar-api",
  );
  return { ...actual, createGoogleCalendar: vi.fn() };
});

import { auth } from "@/lib/auth";
import { getFeatureAvailability } from "@/lib/features/availability";
import {
  createGoogleCalendarConnection,
  getGoogleCalendarAccessToken,
  revokeCalendarConnection,
  updateCalendarConnection,
} from "@/features/v2/calendar/connection-service";
import {
  createGoogleCalendar,
  GOOGLE_CALENDAR_APP_SCOPE,
} from "@/features/v2/calendar/google-calendar-api";

const now = new Date("2026-08-23T08:00:00.000Z");
const selectedConnection = {
  id: "calendar-connection-1",
  provider: "google",
  displayName: "Mood Day",
  timezone: "Europe/Paris",
  detailLevel: "generic",
  lastSyncStartedAt: null,
  lastSyncCompletedAt: null,
  lastSyncErrorCode: null,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
  sourceConnection: {
    status: "active",
    permissionScope: [GOOGLE_CALENDAR_APP_SCOPE],
  },
};

describe("V2 Google Calendar connection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates only a dedicated app-scoped calendar and keeps OAuth tokens in Better Auth", async () => {
    vi.mocked(prisma.account.findMany).mockResolvedValue([
      {
        accountId: "google-account-1",
        scope: `openid email ${GOOGLE_CALENDAR_APP_SCOPE}`,
        updatedAt: now,
      },
    ] as never);
    vi.mocked(prisma.calendarConnection.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.sourceConnection.create).mockResolvedValue({
      id: "source-connection-1",
    } as never);
    vi.mocked(prisma.calendarConnection.create).mockResolvedValue({
      ...selectedConnection,
      sourceConnectionId: "source-connection-1",
      externalCalendarId: null,
      googleAccountId: "google-account-1",
      sourceConnection: {
        status: "paused",
        permissionScope: [GOOGLE_CALENDAR_APP_SCOPE],
      },
    } as never);
    vi.mocked(auth.api.getAccessToken).mockResolvedValue({
      accessToken: "short-lived-access-token",
      accessTokenExpiresAt: new Date("2026-08-23T09:00:00.000Z"),
      scopes: [GOOGLE_CALENDAR_APP_SCOPE],
      idToken: undefined,
    });
    vi.mocked(createGoogleCalendar).mockResolvedValue({
      id: "google-calendar-1",
      summary: "Mood Day",
      timeZone: "Europe/Paris",
    });
    vi.mocked(prisma.calendarConnection.update).mockResolvedValue(
      selectedConnection as never,
    );
    vi.mocked(prisma.syncCursor.upsert).mockResolvedValue({} as never);

    await expect(
      createGoogleCalendarConnection("user-1", {
        operationId: "operation-calendar-1",
        connectionId: "calendar-connection-1",
        sourceConnectionId: "source-connection-1",
        timezone: "Europe/Paris",
        displayName: "Mood Day",
        detailLevel: "generic",
      }),
    ).resolves.toMatchObject({
      id: "calendar-connection-1",
      permissionScope: [GOOGLE_CALENDAR_APP_SCOPE],
    });

    expect(prisma.sourceConnection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: "google_calendar",
        permissionScope: [GOOGLE_CALENDAR_APP_SCOPE],
      }),
    });
    expect(
      JSON.stringify(vi.mocked(prisma.calendarConnection.create).mock.calls),
    ).not.toContain("short-lived-access-token");
    expect(createGoogleCalendar).toHaveBeenCalledWith({
      accessToken: "short-lived-access-token",
      summary: "Mood Day",
      timezone: "Europe/Paris",
    });
  });

  it("rejects broad or stale Google consent before creating any calendar", async () => {
    vi.mocked(prisma.account.findMany).mockResolvedValue([
      {
        accountId: "google-account-1",
        scope: "openid email https://www.googleapis.com/auth/calendar",
        updatedAt: new Date("2026-08-23T06:00:00.000Z"),
      },
    ] as never);

    await expect(
      createGoogleCalendarConnection("user-1", {
        operationId: "operation-calendar-1",
        connectionId: "calendar-connection-1",
        sourceConnectionId: "source-connection-1",
        timezone: "Europe/Paris",
        displayName: "Mood Day",
        detailLevel: "generic",
      }),
    ).rejects.toMatchObject({
      code: "google_calendar_authorization_required",
    });
    expect(createGoogleCalendar).not.toHaveBeenCalled();
  });

  it("revokes server access immediately without deleting the Google calendar", async () => {
    vi.mocked(prisma.calendarConnection.findFirst).mockResolvedValue({
      id: "calendar-connection-1",
    } as never);
    vi.mocked(prisma.calendarConnection.update).mockResolvedValue({} as never);

    await expect(
      revokeCalendarConnection("user-1", "calendar-connection-1"),
    ).resolves.toEqual({ revoked: true });
    expect(prisma.calendarConnection.update).toHaveBeenCalledWith({
      where: { id: "calendar-connection-1" },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        sourceConnection: {
          update: expect.objectContaining({ status: "revoked" }),
        },
      }),
    });
    expect(createGoogleCalendar).not.toHaveBeenCalled();
  });

  it("blocks manual provider access when the calendar kill switch is closed", async () => {
    vi.mocked(getFeatureAvailability).mockReturnValueOnce({
      enabled: false,
      reason: "disabled_by_flag",
    });

    await expect(
      getGoogleCalendarAccessToken({
        userId: "user-1",
        googleAccountId: "google-account-1",
      }),
    ).rejects.toMatchObject({
      code: "google_calendar_disabled_by_flag",
      recoverable: false,
    });
    expect(auth.api.getAccessToken).not.toHaveBeenCalled();
  });

  it("marks aligned events for a fresh push when disclosure detail changes", async () => {
    vi.mocked(prisma.calendarConnection.findFirst).mockResolvedValue({
      id: "calendar-connection-1",
      detailLevel: "generic",
    } as never);
    vi.mocked(prisma.calendarConnection.update).mockResolvedValue({
      ...selectedConnection,
      detailLevel: "appointment",
    } as never);
    vi.mocked(prisma.externalCalendarEvent.updateMany).mockResolvedValue({
      count: 2,
    });

    await updateCalendarConnection("user-1", "calendar-connection-1", {
      detailLevel: "appointment",
    });

    expect(prisma.externalCalendarEvent.updateMany).toHaveBeenCalledWith({
      where: {
        connectionId: "calendar-connection-1",
        syncState: "aligned",
      },
      data: { moodDayVersionAtSync: null },
    });
  });
});

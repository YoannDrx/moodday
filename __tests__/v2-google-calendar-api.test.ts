import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createGoogleCalendar,
  deleteGoogleCalendarEvent,
  GOOGLE_CALENDAR_APP_SCOPE,
  GoogleCalendarSyncTokenExpiredError,
  insertGoogleCalendarEvent,
  listGoogleCalendarEvents,
  updateGoogleCalendarEvent,
} from "@/features/v2/calendar/google-calendar-api";

const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("Google Calendar V2 adapter", () => {
  const fetchImplementation = vi.fn<typeof fetch>();

  beforeEach(() => fetchImplementation.mockReset());

  it("uses the app-created scope and creates a dedicated secondary calendar", async () => {
    fetchImplementation.mockResolvedValue(
      jsonResponse({ id: "moodday-calendar-id", summary: "Mood Day" }),
    );

    await expect(
      createGoogleCalendar({
        accessToken: "provider-token",
        summary: "Mood Day",
        timezone: "Europe/Paris",
        fetchImplementation,
      }),
    ).resolves.toMatchObject({ id: "moodday-calendar-id" });

    expect(GOOGLE_CALENDAR_APP_SCOPE).toBe(
      "https://www.googleapis.com/auth/calendar.app.created",
    );
    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer provider-token",
        }),
        body: JSON.stringify({
          summary: "Mood Day",
          timeZone: "Europe/Paris",
        }),
      }),
    );
  });

  it("paginates sequentially and returns Google's final incremental cursor", async () => {
    fetchImplementation
      .mockResolvedValueOnce(
        jsonResponse({
          items: [{ id: "event-1", status: "confirmed" }],
          nextPageToken: "page-2",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [{ id: "event-2", status: "cancelled" }],
          nextSyncToken: "next-sync-token",
        }),
      );

    await expect(
      listGoogleCalendarEvents({
        accessToken: "provider-token",
        calendarId: "calendar/id",
        syncToken: "previous-sync-token",
        fetchImplementation,
      }),
    ).resolves.toEqual({
      events: [
        { id: "event-1", status: "confirmed" },
        { id: "event-2", status: "cancelled" },
      ],
      nextSyncToken: "next-sync-token",
    });

    const firstUrl = String(fetchImplementation.mock.calls[0]?.[0]);
    const secondUrl = String(fetchImplementation.mock.calls[1]?.[0]);
    expect(firstUrl).toContain("calendars/calendar%2Fid/events");
    expect(firstUrl).toContain("syncToken=previous-sync-token");
    expect(firstUrl).toContain("showDeleted=true");
    expect(secondUrl).toContain("syncToken=previous-sync-token");
    expect(secondUrl).toContain("pageToken=page-2");
  });

  it("turns a 410 response into an explicit full-resync signal", async () => {
    fetchImplementation.mockResolvedValue(
      jsonResponse(
        {
          error: {
            errors: [{ reason: "fullSyncRequired" }],
            code: 410,
          },
        },
        410,
      ),
    );

    await expect(
      listGoogleCalendarEvents({
        accessToken: "provider-token",
        calendarId: "calendar-id",
        syncToken: "expired-token",
        fetchImplementation,
      }),
    ).rejects.toBeInstanceOf(GoogleCalendarSyncTokenExpiredError);
  });

  it("writes only the allowlisted appointment fields and sends optimistic versions", async () => {
    fetchImplementation.mockImplementation(async () =>
      jsonResponse({ id: "event-1", etag: '"version-2"' }),
    );
    const event = {
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
          moodDayManaged: "true" as const,
        },
      },
    };

    await insertGoogleCalendarEvent({
      accessToken: "provider-token",
      calendarId: "calendar-id",
      event,
      fetchImplementation,
    });
    await updateGoogleCalendarEvent({
      accessToken: "provider-token",
      calendarId: "calendar-id",
      eventId: "event-1",
      externalVersion: '"version-1"',
      event,
      fetchImplementation,
    });

    const insertBody = String(fetchImplementation.mock.calls[0]?.[1]?.body);
    expect(insertBody).not.toContain("question");
    expect(insertBody).not.toContain("note");
    expect(insertBody).not.toContain("treatment");
    expect(fetchImplementation.mock.calls[1]?.[1]?.headers).toEqual(
      expect.objectContaining({ "If-Match": '"version-1"' }),
    );
  });

  it("treats an already absent event as a successful idempotent deletion", async () => {
    fetchImplementation.mockResolvedValue(new Response(null, { status: 404 }));
    await expect(
      deleteGoogleCalendarEvent({
        accessToken: "provider-token",
        calendarId: "calendar-id",
        eventId: "event-1",
        externalVersion: '"version-1"',
        fetchImplementation,
      }),
    ).resolves.toBeUndefined();
  });
});

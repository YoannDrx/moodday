import "server-only";

/* eslint-disable no-await-in-loop */

export const GOOGLE_CALENDAR_APP_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export type GoogleCalendarEvent = {
  id: string;
  etag?: string;
  status?: "confirmed" | "tentative" | "cancelled";
  updated?: string;
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  extendedProperties?: {
    private?: Record<string, string>;
  };
};

type GoogleCalendarListResponse = {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
};

type GoogleCalendarResource = {
  id: string;
  summary?: string;
  timeZone?: string;
};

export class GoogleCalendarApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`Google Calendar request failed: ${code}`);
    this.name = "GoogleCalendarApiError";
    this.status = status;
    this.code = code;
  }
}

export class GoogleCalendarSyncTokenExpiredError extends GoogleCalendarApiError {
  constructor() {
    super(410, "sync_token_expired");
    this.name = "GoogleCalendarSyncTokenExpiredError";
  }
}

const readErrorCode = async (response: Response) => {
  try {
    const body = (await response.json()) as {
      error?: { errors?: { reason?: string }[]; status?: string };
    };
    return (
      body.error?.errors?.[0]?.reason ??
      body.error?.status?.toLowerCase() ??
      `http_${response.status}`
    );
  } catch {
    return `http_${response.status}`;
  }
};

const googleRequest = async <T>({
  accessToken,
  path,
  init,
  fetchImplementation = fetch,
}: {
  accessToken: string;
  path: string;
  init?: RequestInit;
  fetchImplementation?: typeof fetch;
}): Promise<T> => {
  const response = await fetchImplementation(`${GOOGLE_CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 410) {
      throw new GoogleCalendarSyncTokenExpiredError();
    }
    throw new GoogleCalendarApiError(
      response.status,
      await readErrorCode(response),
    );
  }
  return (await response.json()) as T;
};

const googleEmptyRequest = async ({
  accessToken,
  path,
  init,
  fetchImplementation = fetch,
}: {
  accessToken: string;
  path: string;
  init: RequestInit;
  fetchImplementation?: typeof fetch;
}) => {
  const response = await fetchImplementation(`${GOOGLE_CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new GoogleCalendarApiError(
      response.status,
      await readErrorCode(response),
    );
  }
};

export const createGoogleCalendar = async ({
  accessToken,
  summary,
  timezone,
  fetchImplementation,
}: {
  accessToken: string;
  summary: string;
  timezone: string;
  fetchImplementation?: typeof fetch;
}) =>
  googleRequest<GoogleCalendarResource>({
    accessToken,
    path: "/calendars",
    init: {
      method: "POST",
      body: JSON.stringify({ summary, timeZone: timezone }),
    },
    fetchImplementation,
  });

export const listGoogleCalendarEvents = async ({
  accessToken,
  calendarId,
  syncToken,
  fetchImplementation,
}: {
  accessToken: string;
  calendarId: string;
  syncToken?: string | null;
  fetchImplementation?: typeof fetch;
}) => {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const query = new URLSearchParams({
      maxResults: "2500",
      showDeleted: "true",
      singleEvents: "false",
    });
    if (syncToken) query.set("syncToken", syncToken);
    if (pageToken) query.set("pageToken", pageToken);
    const page = await googleRequest<GoogleCalendarListResponse>({
      accessToken,
      path: `/calendars/${encodeURIComponent(calendarId)}/events?${query}`,
      fetchImplementation,
    });
    events.push(...(page.items ?? []));
    pageToken = page.nextPageToken;
    nextSyncToken = page.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  if (!nextSyncToken) {
    throw new GoogleCalendarApiError(502, "missing_next_sync_token");
  }
  return { events, nextSyncToken };
};

export type GoogleCalendarEventWrite = {
  summary: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  extendedProperties: {
    private: { moodDayAppointmentId: string; moodDayManaged: "true" };
  };
};

export const insertGoogleCalendarEvent = async ({
  accessToken,
  calendarId,
  event,
  fetchImplementation,
}: {
  accessToken: string;
  calendarId: string;
  event: GoogleCalendarEventWrite;
  fetchImplementation?: typeof fetch;
}) =>
  googleRequest<GoogleCalendarEvent>({
    accessToken,
    path: `/calendars/${encodeURIComponent(calendarId)}/events`,
    init: { method: "POST", body: JSON.stringify(event) },
    fetchImplementation,
  });

export const updateGoogleCalendarEvent = async ({
  accessToken,
  calendarId,
  eventId,
  externalVersion,
  event,
  fetchImplementation,
}: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  externalVersion?: string | null;
  event: GoogleCalendarEventWrite;
  fetchImplementation?: typeof fetch;
}) =>
  googleRequest<GoogleCalendarEvent>({
    accessToken,
    path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    init: {
      method: "PATCH",
      body: JSON.stringify(event),
      headers: externalVersion ? { "If-Match": externalVersion } : undefined,
    },
    fetchImplementation,
  });

export const deleteGoogleCalendarEvent = async ({
  accessToken,
  calendarId,
  eventId,
  externalVersion,
  fetchImplementation,
}: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  externalVersion?: string | null;
  fetchImplementation?: typeof fetch;
}) =>
  googleEmptyRequest({
    accessToken,
    path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    init: {
      method: "DELETE",
      headers: externalVersion ? { "If-Match": externalVersion } : undefined,
    },
    fetchImplementation,
  });

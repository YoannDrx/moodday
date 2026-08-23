import "server-only";

import type {
  CalendarConnectionDto,
  CreateGoogleCalendarConnectionInput,
  UpdateCalendarConnectionInput,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getFeatureAvailability } from "@/lib/features/availability";
import { prisma } from "@/lib/prisma";
import {
  createGoogleCalendar,
  GOOGLE_CALENDAR_APP_SCOPE,
  GoogleCalendarApiError,
} from "./google-calendar-api";

export class CalendarConnectionError extends Error {
  readonly code: string;
  readonly recoverable: boolean;

  constructor(code: string, recoverable = true) {
    super(code);
    this.name = "CalendarConnectionError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

export const calendarConnectionSelection = {
  id: true,
  provider: true,
  displayName: true,
  timezone: true,
  detailLevel: true,
  lastSyncStartedAt: true,
  lastSyncCompletedAt: true,
  lastSyncErrorCode: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
  sourceConnection: {
    select: { status: true, permissionScope: true },
  },
} as const;

type SelectedCalendarConnection = Prisma.CalendarConnectionGetPayload<{
  select: typeof calendarConnectionSelection;
}>;

export const toCalendarConnectionDto = (
  connection: SelectedCalendarConnection,
): CalendarConnectionDto => ({
  id: connection.id,
  provider: connection.provider,
  status: connection.sourceConnection.status,
  displayName: connection.displayName,
  timezone: connection.timezone,
  detailLevel: connection.detailLevel,
  permissionScope: connection.sourceConnection.permissionScope,
  lastSyncStartedAt: connection.lastSyncStartedAt?.toISOString() ?? null,
  lastSyncCompletedAt: connection.lastSyncCompletedAt?.toISOString() ?? null,
  lastSyncErrorCode: connection.lastSyncErrorCode,
  revokedAt: connection.revokedAt?.toISOString() ?? null,
  createdAt: connection.createdAt.toISOString(),
  updatedAt: connection.updatedAt.toISOString(),
});

const scopeSet = (scope: string | null) =>
  new Set((scope ?? "").split(/\s+/).filter(Boolean));

const getAuthorizedGoogleAccount = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: { userId, providerId: "google" },
    orderBy: { updatedAt: "desc" },
    select: { accountId: true, scope: true, updatedAt: true },
  });
  const account = accounts.find(({ scope }) =>
    scopeSet(scope).has(GOOGLE_CALENDAR_APP_SCOPE),
  );
  if (!account) {
    throw new CalendarConnectionError("google_calendar_authorization_required");
  }
  if (account.updatedAt.getTime() < Date.now() - 10 * 60 * 1000) {
    throw new CalendarConnectionError(
      "google_calendar_recent_consent_required",
    );
  }
  return account;
};

export const getGoogleCalendarAccessToken = async ({
  userId,
  googleAccountId,
}: {
  userId: string;
  googleAccountId: string;
}) => {
  assertCalendarFeature();
  try {
    const tokens = await auth.api.getAccessToken({
      body: {
        providerId: "google",
        accountId: googleAccountId,
        userId,
      },
    });
    if (!tokens.accessToken) {
      throw new CalendarConnectionError("google_calendar_token_unavailable");
    }
    return tokens.accessToken;
  } catch (error) {
    if (error instanceof CalendarConnectionError) throw error;
    throw new CalendarConnectionError(
      "google_calendar_reauthorization_required",
    );
  }
};

const assertCalendarFeature = () => {
  const availability = getFeatureAvailability("googleCalendar");
  if (!availability.enabled) {
    throw new CalendarConnectionError(
      `google_calendar_${availability.reason}`,
      false,
    );
  }
};

export const listCalendarConnections = async (userId: string) => {
  const connections = await prisma.calendarConnection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: calendarConnectionSelection,
  });
  return connections.map(toCalendarConnectionDto);
};

export const createGoogleCalendarConnection = async (
  userId: string,
  input: CreateGoogleCalendarConnectionInput,
): Promise<CalendarConnectionDto> => {
  assertCalendarFeature();
  const account = await getAuthorizedGoogleAccount(userId);
  const existing = await prisma.calendarConnection.findFirst({
    where: {
      userId,
      OR: [{ operationId: input.operationId }, { provider: "google" }],
    },
    select: {
      ...calendarConnectionSelection,
      sourceConnectionId: true,
      externalCalendarId: true,
      googleAccountId: true,
    },
  });

  if (existing?.externalCalendarId) {
    if (existing.revokedAt) {
      const reactivated = await prisma.calendarConnection.update({
        where: { id: existing.id },
        data: {
          googleAccountId: account.accountId,
          revokedAt: null,
          sourceConnection: {
            update: {
              status: "active",
              revokedAt: null,
              pausedAt: null,
              externalAccountReference: account.accountId,
              permissionScope: [GOOGLE_CALENDAR_APP_SCOPE],
            },
          },
        },
        select: calendarConnectionSelection,
      });
      return toCalendarConnectionDto(reactivated);
    }
    return toCalendarConnectionDto(existing);
  }

  const pending =
    existing ??
    (await prisma.$transaction(async (transaction) => {
      const sourceConnection = await transaction.sourceConnection.create({
        data: {
          id: input.sourceConnectionId,
          userId,
          kind: "google_calendar",
          status: "paused",
          externalAccountReference: account.accountId,
          permissionScope: [GOOGLE_CALENDAR_APP_SCOPE],
        },
      });
      return transaction.calendarConnection.create({
        data: {
          id: input.connectionId,
          userId,
          sourceConnectionId: sourceConnection.id,
          operationId: input.operationId,
          provider: "google",
          googleAccountId: account.accountId,
          displayName: input.displayName,
          timezone: input.timezone,
          detailLevel: input.detailLevel,
        },
        select: {
          ...calendarConnectionSelection,
          sourceConnectionId: true,
          externalCalendarId: true,
          googleAccountId: true,
        },
      });
    }));

  const accessToken = await getGoogleCalendarAccessToken({
    userId,
    googleAccountId: account.accountId,
  });
  try {
    const calendar = await createGoogleCalendar({
      accessToken,
      summary: input.displayName,
      timezone: input.timezone,
    });
    const connected = await prisma.calendarConnection.update({
      where: { id: pending.id },
      data: {
        externalCalendarId: calendar.id,
        googleAccountId: account.accountId,
        lastSyncErrorCode: null,
        sourceConnection: {
          update: {
            status: "active",
            pausedAt: null,
            revokedAt: null,
            lastSyncedAt: null,
          },
        },
      },
      select: calendarConnectionSelection,
    });
    await prisma.syncCursor.upsert({
      where: {
        sourceConnectionId_scope: {
          sourceConnectionId: pending.sourceConnectionId,
          scope: "google_calendar_events",
        },
      },
      create: {
        sourceConnectionId: pending.sourceConnectionId,
        scope: "google_calendar_events",
      },
      update: { cursor: null, invalidatedAt: null },
    });
    return toCalendarConnectionDto(connected);
  } catch (error) {
    const code =
      error instanceof GoogleCalendarApiError
        ? `google_calendar_${error.code}`
        : "google_calendar_initialization_failed";
    await prisma.sourceConnection.update({
      where: { id: pending.sourceConnectionId },
      data: { status: "error" },
    });
    await prisma.calendarConnection.update({
      where: { id: pending.id },
      data: { lastSyncErrorCode: code },
    });
    throw new CalendarConnectionError(code);
  }
};

export const updateCalendarConnection = async (
  userId: string,
  connectionId: string,
  input: UpdateCalendarConnectionInput,
) => {
  const existing = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, userId, revokedAt: null },
    select: { id: true, detailLevel: true },
  });
  if (!existing) {
    throw new CalendarConnectionError("calendar_connection_unavailable", false);
  }
  const status = input.status;
  const connection = await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: {
      detailLevel: input.detailLevel,
      sourceConnection: status
        ? {
            update: {
              status,
              pausedAt: status === "paused" ? new Date() : null,
            },
          }
        : undefined,
    },
    select: calendarConnectionSelection,
  });
  if (input.detailLevel && input.detailLevel !== existing.detailLevel) {
    await prisma.externalCalendarEvent.updateMany({
      where: { connectionId, syncState: "aligned" },
      data: { moodDayVersionAtSync: null },
    });
  }
  return toCalendarConnectionDto(connection);
};

export const revokeCalendarConnection = async (
  userId: string,
  connectionId: string,
) => {
  const existing = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, userId },
    select: { id: true },
  });
  if (!existing) {
    throw new CalendarConnectionError("calendar_connection_unavailable", false);
  }
  const revokedAt = new Date();
  await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: {
      revokedAt,
      syncLeaseUntil: null,
      sourceConnection: {
        update: { status: "revoked", revokedAt, pausedAt: null },
      },
    },
  });
  return { revoked: true };
};

-- Mood Day V2 calendar synchronization registry.
-- OAuth credentials remain owned by Better Auth and are never copied here.

CREATE TYPE "CalendarProvider" AS ENUM ('google', 'native');
CREATE TYPE "CalendarDetailLevel" AS ENUM ('generic', 'appointment');
CREATE TYPE "CalendarEventSyncState" AS ENUM ('aligned', 'conflict', 'provider_deleted', 'moodday_deleted');

CREATE TABLE "v2_calendar_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceConnectionId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "googleAccountId" TEXT,
    "externalCalendarId" TEXT,
    "displayName" TEXT NOT NULL DEFAULT 'Mood Day',
    "timezone" TEXT NOT NULL,
    "detailLevel" "CalendarDetailLevel" NOT NULL DEFAULT 'generic',
    "syncLeaseUntil" TIMESTAMP(3),
    "lastSyncStartedAt" TIMESTAMP(3),
    "lastSyncCompletedAt" TIMESTAMP(3),
    "lastSyncErrorCode" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "v2_calendar_connection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "v2_external_calendar_event" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "externalEventId" TEXT NOT NULL,
    "externalVersion" TEXT,
    "externalUpdatedAt" TIMESTAMP(3),
    "externalDigest" TEXT,
    "moodDayDigest" TEXT,
    "moodDayVersionAtSync" TIMESTAMP(3),
    "title" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT,
    "location" TEXT,
    "syncState" "CalendarEventSyncState" NOT NULL DEFAULT 'aligned',
    "conflictDetectedAt" TIMESTAMP(3),
    "providerDeletedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "v2_external_calendar_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "v2_calendar_connection_sourceConnectionId_key" ON "v2_calendar_connection"("sourceConnectionId");
CREATE UNIQUE INDEX "v2_calendar_connection_userId_operationId_key" ON "v2_calendar_connection"("userId", "operationId");
CREATE UNIQUE INDEX "v2_calendar_connection_userId_provider_key" ON "v2_calendar_connection"("userId", "provider");
CREATE UNIQUE INDEX "v2_calendar_connection_provider_externalCalendarId_key" ON "v2_calendar_connection"("provider", "externalCalendarId");
CREATE INDEX "v2_calendar_connection_userId_revokedAt_idx" ON "v2_calendar_connection"("userId", "revokedAt");
CREATE UNIQUE INDEX "v2_external_calendar_event_connectionId_externalEventId_key" ON "v2_external_calendar_event"("connectionId", "externalEventId");
CREATE UNIQUE INDEX "v2_external_calendar_event_connectionId_appointmentId_key" ON "v2_external_calendar_event"("connectionId", "appointmentId");
CREATE INDEX "v2_external_calendar_event_connectionId_syncState_updatedAt_idx" ON "v2_external_calendar_event"("connectionId", "syncState", "updatedAt");
CREATE INDEX "v2_external_calendar_event_appointmentId_idx" ON "v2_external_calendar_event"("appointmentId");

ALTER TABLE "v2_calendar_connection" ADD CONSTRAINT "v2_calendar_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_calendar_connection" ADD CONSTRAINT "v2_calendar_connection_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "v2_source_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_external_calendar_event" ADD CONSTRAINT "v2_external_calendar_event_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "v2_calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_external_calendar_event" ADD CONSTRAINT "v2_external_calendar_event_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "v2_appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

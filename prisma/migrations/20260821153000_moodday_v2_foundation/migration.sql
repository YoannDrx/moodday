-- CreateEnum
CREATE TYPE "CheckInDepth" AS ENUM ('presence', 'quick', 'complete');

-- CreateEnum
CREATE TYPE "ObservationSource" AS ENUM ('user', 'healthkit', 'health_connect', 'calendar', 'caregiver', 'estimated');

-- CreateEnum
CREATE TYPE "ObservationQuality" AS ENUM ('complete', 'partial', 'estimated', 'contested');

-- CreateEnum
CREATE TYPE "SourceConnectionKind" AS ENUM ('healthkit', 'health_connect', 'google_calendar', 'native_calendar');

-- CreateEnum
CREATE TYPE "SourceConnectionStatus" AS ENUM ('active', 'paused', 'permission_denied', 'revoked', 'error');

-- CreateEnum
CREATE TYPE "RoutineStatus" AS ENUM ('active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "RoutineOccurrenceStatus" AS ENUM ('planned', 'completed', 'skipped', 'cancelled');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('moodday', 'google_calendar', 'native_calendar');

-- CreateEnum
CREATE TYPE "AppointmentPreparationStatus" AS ENUM ('not_started', 'in_progress', 'ready', 'reviewed');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('web', 'ios', 'android');

-- CreateEnum
CREATE TYPE "SyncMutation" AS ENUM ('create', 'update', 'delete');

-- CreateEnum
CREATE TYPE "SyncOperationStatus" AS ENUM ('applied', 'duplicate', 'conflict', 'rejected');

-- CreateEnum
CREATE TYPE "SubscriptionProvider" AS ENUM ('stripe', 'app_store', 'play_store');

-- CreateEnum
CREATE TYPE "SubscriptionSourceStatus" AS ENUM ('active', 'trialing', 'grace', 'paused', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('received', 'processed', 'ignored', 'failed');

-- CreateTable
CREATE TABLE "v2_check_in" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "depth" "CheckInDepth" NOT NULL,
    "localDate" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "valence" INTEGER,
    "activation" INTEGER,
    "irritability" INTEGER,
    "anxiety" INTEGER,
    "contexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_check_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_observation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "localDate" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "provenance" "ObservationSource" NOT NULL,
    "sourceReference" TEXT,
    "coverage" DECIMAL(5,4),
    "quality" "ObservationQuality" NOT NULL DEFAULT 'complete',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "algorithmVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_daily_aggregate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceConnectionId" TEXT,
    "operationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "provenance" "ObservationSource" NOT NULL,
    "coverage" DECIMAL(5,4),
    "quality" "ObservationQuality" NOT NULL DEFAULT 'complete',
    "algorithmVersion" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_daily_aggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_source_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "SourceConnectionKind" NOT NULL,
    "status" "SourceConnectionStatus" NOT NULL DEFAULT 'active',
    "externalAccountReference" TEXT,
    "permissionScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pausedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_source_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_sync_cursor" (
    "id" TEXT NOT NULL,
    "sourceConnectionId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "cursor" TEXT,
    "invalidatedAt" TIMESTAMP(3),
    "lastFullSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_sync_cursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "schedule" JSONB,
    "weeklyTarget" INTEGER,
    "status" "RoutineStatus" NOT NULL DEFAULT 'active',
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_routine_occurrence" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "RoutineOccurrenceStatus" NOT NULL DEFAULT 'planned',
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_routine_occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_clinician" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "specialty" TEXT,
    "organization" TEXT,
    "contact" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_clinician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_appointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "operationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL,
    "location" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "source" "AppointmentSource" NOT NULL DEFAULT 'moodday',
    "externalEventId" TEXT,
    "externalVersion" TEXT,
    "preparationStatus" "AppointmentPreparationStatus" NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_appointment_question" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "privateNote" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_appointment_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "displayName" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_sync_operation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "operationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "mutation" "SyncMutation" NOT NULL,
    "status" "SyncOperationStatus" NOT NULL DEFAULT 'applied',
    "payloadDigest" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_sync_operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_subscription_source" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SubscriptionProvider" NOT NULL,
    "externalCustomerId" TEXT,
    "externalSubscriptionId" TEXT,
    "productId" TEXT,
    "status" "SubscriptionSourceStatus" NOT NULL,
    "currentPeriodEndsAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_subscription_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_entitlement_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entitlement" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "sourceProviders" "SubscriptionProvider"[] DEFAULT ARRAY[]::"SubscriptionProvider"[],
    "validUntil" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v2_entitlement_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v2_billing_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" "SubscriptionProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "BillingEventStatus" NOT NULL DEFAULT 'received',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_billing_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "v2_check_in_userId_localDate_createdAt_idx" ON "v2_check_in"("userId", "localDate", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "v2_check_in_userId_operationId_key" ON "v2_check_in"("userId", "operationId");

-- CreateIndex
CREATE INDEX "v2_observation_userId_metric_localDate_idx" ON "v2_observation"("userId", "metric", "localDate");

-- CreateIndex
CREATE INDEX "v2_observation_userId_provenance_importedAt_idx" ON "v2_observation"("userId", "provenance", "importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "v2_observation_userId_operationId_key" ON "v2_observation"("userId", "operationId");

-- CreateIndex
CREATE INDEX "v2_daily_aggregate_userId_metric_localDate_idx" ON "v2_daily_aggregate"("userId", "metric", "localDate");

-- CreateIndex
CREATE INDEX "v2_daily_aggregate_sourceConnectionId_importedAt_idx" ON "v2_daily_aggregate"("sourceConnectionId", "importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "v2_daily_aggregate_userId_operationId_key" ON "v2_daily_aggregate"("userId", "operationId");

-- CreateIndex
CREATE INDEX "v2_source_connection_userId_kind_status_idx" ON "v2_source_connection"("userId", "kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "v2_sync_cursor_sourceConnectionId_scope_key" ON "v2_sync_cursor"("sourceConnectionId", "scope");

-- CreateIndex
CREATE INDEX "v2_routine_userId_status_idx" ON "v2_routine"("userId", "status");

-- CreateIndex
CREATE INDEX "v2_routine_occurrence_routineId_localDate_idx" ON "v2_routine_occurrence"("routineId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "v2_routine_occurrence_routineId_operationId_key" ON "v2_routine_occurrence"("routineId", "operationId");

-- CreateIndex
CREATE INDEX "v2_clinician_userId_archivedAt_idx" ON "v2_clinician"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "v2_appointment_userId_startsAt_status_idx" ON "v2_appointment"("userId", "startsAt", "status");

-- CreateIndex
CREATE INDEX "v2_appointment_userId_externalEventId_idx" ON "v2_appointment"("userId", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "v2_appointment_userId_operationId_key" ON "v2_appointment"("userId", "operationId");

-- CreateIndex
CREATE INDEX "v2_appointment_question_appointmentId_position_idx" ON "v2_appointment_question"("appointmentId", "position");

-- CreateIndex
CREATE INDEX "v2_device_userId_revokedAt_idx" ON "v2_device"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "v2_device_userId_publicId_key" ON "v2_device"("userId", "publicId");

-- CreateIndex
CREATE INDEX "v2_sync_operation_userId_createdAt_idx" ON "v2_sync_operation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "v2_sync_operation_userId_operationId_key" ON "v2_sync_operation"("userId", "operationId");

-- CreateIndex
CREATE INDEX "v2_subscription_source_userId_status_idx" ON "v2_subscription_source"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "v2_subscription_source_provider_externalSubscriptionId_key" ON "v2_subscription_source"("provider", "externalSubscriptionId");

-- CreateIndex
CREATE INDEX "v2_entitlement_snapshot_userId_entitlement_calculatedAt_idx" ON "v2_entitlement_snapshot"("userId", "entitlement", "calculatedAt");

-- CreateIndex
CREATE INDEX "v2_billing_event_status_createdAt_idx" ON "v2_billing_event"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "v2_billing_event_provider_externalEventId_key" ON "v2_billing_event"("provider", "externalEventId");

-- AddForeignKey
ALTER TABLE "v2_check_in" ADD CONSTRAINT "v2_check_in_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_observation" ADD CONSTRAINT "v2_observation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_daily_aggregate" ADD CONSTRAINT "v2_daily_aggregate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_daily_aggregate" ADD CONSTRAINT "v2_daily_aggregate_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "v2_source_connection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_source_connection" ADD CONSTRAINT "v2_source_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_sync_cursor" ADD CONSTRAINT "v2_sync_cursor_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "v2_source_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_routine" ADD CONSTRAINT "v2_routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_routine_occurrence" ADD CONSTRAINT "v2_routine_occurrence_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "v2_routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_clinician" ADD CONSTRAINT "v2_clinician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_appointment" ADD CONSTRAINT "v2_appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_appointment" ADD CONSTRAINT "v2_appointment_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "v2_clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_appointment_question" ADD CONSTRAINT "v2_appointment_question_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "v2_appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_device" ADD CONSTRAINT "v2_device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_sync_operation" ADD CONSTRAINT "v2_sync_operation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_sync_operation" ADD CONSTRAINT "v2_sync_operation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "v2_device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_subscription_source" ADD CONSTRAINT "v2_subscription_source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_entitlement_snapshot" ADD CONSTRAINT "v2_entitlement_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v2_billing_event" ADD CONSTRAINT "v2_billing_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain invariants which must hold independently of a web or mobile client.
ALTER TABLE "v2_check_in" ADD CONSTRAINT "v2_check_in_scales_check"
CHECK (
  ("valence" IS NULL OR "valence" BETWEEN 0 AND 10) AND
  ("activation" IS NULL OR "activation" BETWEEN 0 AND 10) AND
  ("irritability" IS NULL OR "irritability" BETWEEN 0 AND 10) AND
  ("anxiety" IS NULL OR "anxiety" BETWEEN 0 AND 10)
);

ALTER TABLE "v2_check_in" ADD CONSTRAINT "v2_check_in_depth_check"
CHECK (
  "depth" = 'presence' OR
  ("valence" IS NOT NULL AND "activation" IS NOT NULL AND "irritability" IS NOT NULL)
);

ALTER TABLE "v2_observation" ADD CONSTRAINT "v2_observation_window_check"
CHECK ("windowEnd" > "windowStart");

ALTER TABLE "v2_observation" ADD CONSTRAINT "v2_observation_coverage_check"
CHECK ("coverage" IS NULL OR "coverage" BETWEEN 0 AND 1);

ALTER TABLE "v2_daily_aggregate" ADD CONSTRAINT "v2_daily_aggregate_window_check"
CHECK ("windowEnd" > "windowStart");

ALTER TABLE "v2_daily_aggregate" ADD CONSTRAINT "v2_daily_aggregate_coverage_check"
CHECK ("coverage" IS NULL OR "coverage" BETWEEN 0 AND 1);

ALTER TABLE "v2_routine" ADD CONSTRAINT "v2_routine_weekly_target_check"
CHECK ("weeklyTarget" IS NULL OR "weeklyTarget" BETWEEN 1 AND 99);

ALTER TABLE "v2_appointment" ADD CONSTRAINT "v2_appointment_window_check"
CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");

ALTER TABLE "v2_appointment_question" ADD CONSTRAINT "v2_appointment_question_position_check"
CHECK ("position" >= 0);

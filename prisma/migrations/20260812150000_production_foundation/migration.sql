-- Production foundation: additive schema for verified identity, consent,
-- operational reliability, caregiver revocation and product lifecycle.

CREATE TYPE "ConsentPurpose" AS ENUM ('age_18', 'terms', 'privacy', 'ai_insights', 'ai_journal_notes', 'caregiver_sharing');
CREATE TYPE "ConsentSource" AS ENUM ('signup', 'onboarding', 'settings', 'migration_gate');
CREATE TYPE "OperationalJobStatus" AS ENUM ('pending', 'processing', 'retry', 'succeeded', 'dead');
CREATE TYPE "InventoryEventReason" AS ENUM ('refill', 'intake', 'correction', 'manual');
CREATE TYPE "MoodTagCategory" AS ENUM ('context', 'trigger', 'protective');
CREATE TYPE "ConsultationPreparationStatus" AS ENUM ('draft', 'completed', 'archived');

ALTER TABLE "user"
  ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false,
  ADD COLUMN "age18Accepted" BOOLEAN DEFAULT false,
  ADD COLUMN "termsVersionAccepted" TEXT,
  ADD COLUMN "privacyVersionAccepted" TEXT,
  ADD COLUMN "signupLocale" TEXT DEFAULT 'fr',
  ADD COLUMN "launchCountry" TEXT DEFAULT 'FR';

ALTER TABLE "user_preferences"
  ALTER COLUMN "notificationsEnabled" SET DEFAULT false,
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr',
  ADD COLUMN "notificationContentMode" TEXT NOT NULL DEFAULT 'generic',
  ADD COLUMN "trustedDevice" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "caregiverAccessDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "caregiverAccessDigestFrequency" TEXT NOT NULL DEFAULT 'weekly';

-- Existing accounts never opted in to browser push under the new policy.
UPDATE "user_preferences" SET "notificationsEnabled" = false;

ALTER TABLE "push_subscription"
  ADD COLUMN "deviceId" TEXT,
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr',
  ADD COLUMN "contentMode" TEXT NOT NULL DEFAULT 'generic',
  ADD COLUMN "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "disabledAt" TIMESTAMP(3);

ALTER TABLE "caregiver_relationship"
  ADD COLUMN "accessExpiresAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedById" TEXT,
  ADD COLUMN "moodWindowDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "medicationWindowDays" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "medication"
  ADD COLUMN "startDate" TEXT,
  ADD COLUMN "endDate" TEXT,
  ADD COLUMN "stockQuantity" DECIMAL(12,3),
  ADD COLUMN "unitsPerDose" DECIMAL(12,3),
  ADD COLUMN "lowStockThreshold" DECIMAL(12,3);

CREATE TABLE "twoFactor" (
  "id" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "backupCodes" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "verified" BOOLEAN DEFAULT true,
  "failedVerificationCount" INTEGER DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "passkey" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "publicKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credentialID" TEXT NOT NULL,
  "counter" INTEGER NOT NULL,
  "deviceType" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL,
  "transports" TEXT,
  "createdAt" TIMESTAMP(3),
  "aaguid" TEXT,
  CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_consent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" "ConsentPurpose" NOT NULL,
  "version" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'fr',
  "country" TEXT NOT NULL DEFAULT 'FR',
  "source" "ConsentSource" NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "user_consent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_webhook_event" (
  "id" TEXT NOT NULL,
  "svixId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "providerCreatedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "lastErrorCode" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operational_job_run" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "executionKey" TEXT NOT NULL,
  "status" "OperationalJobStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "operational_job_run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operational_heartbeat" (
  "serviceName" TEXT NOT NULL,
  "lastStartedAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "lastFailureAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "alertState" TEXT NOT NULL DEFAULT 'healthy',
  "lastAlertAt" TIMESTAMP(3),
  "lastRecoveryAlertAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "operational_heartbeat_pkey" PRIMARY KEY ("serviceName")
);

CREATE TABLE "external_deletion_job" (
  "id" TEXT NOT NULL,
  "subjectReference" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceLocator" TEXT NOT NULL,
  "status" "OperationalJobStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "lastErrorCode" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_deletion_job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_schedule_revision" (
  "id" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "effectiveDate" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "scheduleTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "weeklyDay" INTEGER,
  "unitsPerDose" DECIMAL(12,3),
  "reason" TEXT,
  "authoredById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medication_schedule_revision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_inventory_event" (
  "id" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "medIntakeId" TEXT,
  "quantityDelta" DECIMAL(12,3) NOT NULL,
  "reason" "InventoryEventReason" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medication_inventory_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mood_tag_definition" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "normalizedLabel" TEXT NOT NULL,
  "displayLabel" TEXT NOT NULL,
  "category" "MoodTagCategory" NOT NULL,
  "color" TEXT,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mood_tag_definition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consultation_preparation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3),
  "title" TEXT NOT NULL,
  "questions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "periodStartDate" TEXT NOT NULL,
  "periodEndDate" TEXT NOT NULL,
  "personalNotes" TEXT,
  "status" "ConsultationPreparationStatus" NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consultation_preparation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "safety_plan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "warningSigns" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "copingStrategies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "safePlaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "trustedContacts" JSONB,
  "professionalContacts" JSONB,
  "lastReviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "safety_plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscription_userId_deviceId_key" ON "push_subscription"("userId", "deviceId");
CREATE INDEX "caregiver_relationship_revokedById_idx" ON "caregiver_relationship"("revokedById");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");
CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");
CREATE UNIQUE INDEX "user_consent_userId_purpose_version_key" ON "user_consent"("userId", "purpose", "version");
CREATE INDEX "user_consent_userId_purpose_acceptedAt_idx" ON "user_consent"("userId", "purpose", "acceptedAt");
CREATE UNIQUE INDEX "email_webhook_event_svixId_key" ON "email_webhook_event"("svixId");
CREATE INDEX "email_webhook_event_status_createdAt_idx" ON "email_webhook_event"("status", "createdAt");
CREATE UNIQUE INDEX "operational_job_run_executionKey_key" ON "operational_job_run"("executionKey");
CREATE INDEX "operational_job_run_jobName_status_nextAttemptAt_idx" ON "operational_job_run"("jobName", "status", "nextAttemptAt");
CREATE INDEX "external_deletion_job_status_nextAttemptAt_idx" ON "external_deletion_job"("status", "nextAttemptAt");
CREATE INDEX "external_deletion_job_retentionUntil_idx" ON "external_deletion_job"("retentionUntil");
CREATE UNIQUE INDEX "external_deletion_job_subjectReference_resourceType_resourceLocator_key" ON "external_deletion_job"("subjectReference", "resourceType", "resourceLocator");
CREATE UNIQUE INDEX "medication_schedule_revision_medicationId_effectiveDate_createdAt_key" ON "medication_schedule_revision"("medicationId", "effectiveDate", "createdAt");
CREATE INDEX "medication_schedule_revision_medicationId_effectiveDate_idx" ON "medication_schedule_revision"("medicationId", "effectiveDate");
CREATE INDEX "medication_inventory_event_medicationId_occurredAt_idx" ON "medication_inventory_event"("medicationId", "occurredAt");
CREATE INDEX "medication_inventory_event_medIntakeId_idx" ON "medication_inventory_event"("medIntakeId");
CREATE UNIQUE INDEX "mood_tag_definition_userId_normalizedLabel_category_key" ON "mood_tag_definition"("userId", "normalizedLabel", "category");
CREATE INDEX "mood_tag_definition_userId_isArchived_idx" ON "mood_tag_definition"("userId", "isArchived");
CREATE INDEX "consultation_preparation_userId_status_updatedAt_idx" ON "consultation_preparation"("userId", "status", "updatedAt");
CREATE UNIQUE INDEX "safety_plan_userId_key" ON "safety_plan"("userId");

ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "caregiver_relationship" ADD CONSTRAINT "caregiver_relationship_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_consent" ADD CONSTRAINT "user_consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_schedule_revision" ADD CONSTRAINT "medication_schedule_revision_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_inventory_event" ADD CONSTRAINT "medication_inventory_event_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_inventory_event" ADD CONSTRAINT "medication_inventory_event_medIntakeId_fkey" FOREIGN KEY ("medIntakeId") REFERENCES "med_intake"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mood_tag_definition" ADD CONSTRAINT "mood_tag_definition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultation_preparation" ADD CONSTRAINT "consultation_preparation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_plan" ADD CONSTRAINT "safety_plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing medications receive a conservative UTC-derived initial revision.
-- No consent and no verification status are fabricated by this migration.
INSERT INTO "medication_schedule_revision" (
  "id", "medicationId", "effectiveDate", "dosage", "frequency",
  "scheduleTimes", "weeklyDay", "authoredById", "createdAt"
)
SELECT
  'msr_' || md5(m."id" || ':initial'),
  m."id",
  to_char(m."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
  m."dosage",
  m."frequency",
  m."scheduleTimes",
  m."weeklyDay",
  m."userId",
  m."createdAt"
FROM "medication" m;

-- Historical baseline for Moodday domain tables.
--
-- The first four migrations only captured the authentication/billing tables;
-- the domain schema was originally introduced with `prisma db push`. This
-- additive, idempotent migration makes a fresh `prisma migrate deploy` viable
-- without rewriting migrations that are already applied in production.

CREATE TABLE IF NOT EXISTS "mood_entry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "note" TEXT,
  "energy" INTEGER,
  "sleepHours" DOUBLE PRECISION,
  "sleepQuality" TEXT,
  "sleepDisturbances" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "anxiety" INTEGER,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sideEffects" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "syncStatus" TEXT NOT NULL DEFAULT 'synced',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mood_entry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "medication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "isPRN" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "syncStatus" TEXT NOT NULL DEFAULT 'synced',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "medication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "med_intake" (
  "id" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "skipped" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "med_intake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "medication_history" (
  "id" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "previousDosage" TEXT,
  "reason" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medication_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "therapy_session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT NOT NULL,
  "benefitRating" INTEGER,
  "syncStatus" TEXT NOT NULL DEFAULT 'synced',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "therapy_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exercise" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "syncStatus" TEXT NOT NULL DEFAULT 'synced',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exercise_log" (
  "id" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exercise_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
  "onboardingStep" INTEGER NOT NULL DEFAULT 0,
  "defaultChartPeriod" INTEGER NOT NULL DEFAULT 30,
  "timezone" TEXT,
  "theme" TEXT,
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "dailyCheckInReminder" BOOLEAN NOT NULL DEFAULT true,
  "dailyCheckInTime" TEXT NOT NULL DEFAULT '09:00',
  "medicationReminders" BOOLEAN NOT NULL DEFAULT true,
  "medicationReminderTime" TEXT NOT NULL DEFAULT '09:00',
  "lastDailyCheckInSentDate" TEXT,
  "lastMedicationReminderSentDate" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "push_subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "expirationTime" TIMESTAMP(3),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "caregiver_observation" (
  "id" TEXT NOT NULL,
  "observerId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "moodObserved" TEXT,
  "energyObserved" TEXT,
  "socialBehavior" TEXT,
  "sleepObserved" TEXT,
  "notes" TEXT,
  "visibleToPatient" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "caregiver_observation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "caregiver_event" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "severity" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "visibleToPatient" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "caregiver_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "caregiver_relationship" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "caregiverId" TEXT,
  "caregiverEmail" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "label" TEXT,
  "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'pending',
  "inviteToken" TEXT,
  "inviteExpiry" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "caregiver_relationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "newsletter_subscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'fr',
  "source" TEXT NOT NULL DEFAULT 'landing',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_log" (
  "id" TEXT NOT NULL,
  "resendId" TEXT,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "userId" TEXT,
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "bouncedAt" TIMESTAMP(3),
  "complainedAt" TIMESTAMP(3),
  "error" TEXT,
  CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "mood_entry_userId_idx" ON "mood_entry"("userId");
CREATE INDEX IF NOT EXISTS "mood_entry_createdAt_idx" ON "mood_entry"("createdAt");
CREATE INDEX IF NOT EXISTS "medication_userId_idx" ON "medication"("userId");
CREATE INDEX IF NOT EXISTS "medication_isArchived_idx" ON "medication"("isArchived");
CREATE INDEX IF NOT EXISTS "med_intake_medicationId_idx" ON "med_intake"("medicationId");
CREATE INDEX IF NOT EXISTS "med_intake_takenAt_idx" ON "med_intake"("takenAt");
CREATE INDEX IF NOT EXISTS "medication_history_medicationId_idx" ON "medication_history"("medicationId");
CREATE INDEX IF NOT EXISTS "medication_history_changedAt_idx" ON "medication_history"("changedAt");
CREATE INDEX IF NOT EXISTS "therapy_session_userId_idx" ON "therapy_session"("userId");
CREATE INDEX IF NOT EXISTS "therapy_session_date_idx" ON "therapy_session"("date");
CREATE INDEX IF NOT EXISTS "exercise_userId_idx" ON "exercise"("userId");
CREATE INDEX IF NOT EXISTS "exercise_isArchived_idx" ON "exercise"("isArchived");
CREATE INDEX IF NOT EXISTS "exercise_log_exerciseId_idx" ON "exercise_log"("exerciseId");
CREATE INDEX IF NOT EXISTS "exercise_log_completedAt_idx" ON "exercise_log"("completedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_userId_key" ON "user_preferences"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscription_endpoint_key" ON "push_subscription"("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscription_userId_idx" ON "push_subscription"("userId");
CREATE INDEX IF NOT EXISTS "caregiver_observation_observerId_idx" ON "caregiver_observation"("observerId");
CREATE INDEX IF NOT EXISTS "caregiver_observation_subjectId_idx" ON "caregiver_observation"("subjectId");
CREATE INDEX IF NOT EXISTS "caregiver_observation_createdAt_idx" ON "caregiver_observation"("createdAt");
CREATE INDEX IF NOT EXISTS "caregiver_event_reporterId_idx" ON "caregiver_event"("reporterId");
CREATE INDEX IF NOT EXISTS "caregiver_event_subjectId_idx" ON "caregiver_event"("subjectId");
CREATE INDEX IF NOT EXISTS "caregiver_event_eventDate_idx" ON "caregiver_event"("eventDate");
CREATE UNIQUE INDEX IF NOT EXISTS "caregiver_relationship_inviteToken_key" ON "caregiver_relationship"("inviteToken");
CREATE INDEX IF NOT EXISTS "caregiver_relationship_patientId_idx" ON "caregiver_relationship"("patientId");
CREATE INDEX IF NOT EXISTS "caregiver_relationship_caregiverId_idx" ON "caregiver_relationship"("caregiverId");
CREATE INDEX IF NOT EXISTS "caregiver_relationship_caregiverEmail_idx" ON "caregiver_relationship"("caregiverEmail");
CREATE INDEX IF NOT EXISTS "caregiver_relationship_inviteToken_idx" ON "caregiver_relationship"("inviteToken");
CREATE UNIQUE INDEX IF NOT EXISTS "caregiver_relationship_patientId_caregiverId_key" ON "caregiver_relationship"("patientId", "caregiverId");
CREATE UNIQUE INDEX IF NOT EXISTS "caregiver_relationship_patientId_caregiverEmail_key" ON "caregiver_relationship"("patientId", "caregiverEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");
CREATE INDEX IF NOT EXISTS "newsletter_subscriber_email_idx" ON "newsletter_subscriber"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "email_log_resendId_key" ON "email_log"("resendId");
CREATE INDEX IF NOT EXISTS "email_log_resendId_idx" ON "email_log"("resendId");
CREATE INDEX IF NOT EXISTS "email_log_userId_idx" ON "email_log"("userId");
CREATE INDEX IF NOT EXISTS "email_log_template_idx" ON "email_log"("template");
CREATE INDEX IF NOT EXISTS "email_log_status_idx" ON "email_log"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mood_entry_userId_fkey') THEN
    ALTER TABLE "mood_entry" ADD CONSTRAINT "mood_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_userId_fkey') THEN
    ALTER TABLE "medication" ADD CONSTRAINT "medication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'med_intake_medicationId_fkey') THEN
    ALTER TABLE "med_intake" ADD CONSTRAINT "med_intake_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_history_medicationId_fkey') THEN
    ALTER TABLE "medication_history" ADD CONSTRAINT "medication_history_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'therapy_session_userId_fkey') THEN
    ALTER TABLE "therapy_session" ADD CONSTRAINT "therapy_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_userId_fkey') THEN
    ALTER TABLE "exercise" ADD CONSTRAINT "exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_log_exerciseId_fkey') THEN
    ALTER TABLE "exercise_log" ADD CONSTRAINT "exercise_log_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caregiver_observation_observerId_fkey') THEN
    ALTER TABLE "caregiver_observation" ADD CONSTRAINT "caregiver_observation_observerId_fkey" FOREIGN KEY ("observerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caregiver_observation_subjectId_fkey') THEN
    ALTER TABLE "caregiver_observation" ADD CONSTRAINT "caregiver_observation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caregiver_event_reporterId_fkey') THEN
    ALTER TABLE "caregiver_event" ADD CONSTRAINT "caregiver_event_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caregiver_event_subjectId_fkey') THEN
    ALTER TABLE "caregiver_event" ADD CONSTRAINT "caregiver_event_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caregiver_relationship_patientId_fkey') THEN
    ALTER TABLE "caregiver_relationship" ADD CONSTRAINT "caregiver_relationship_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caregiver_relationship_caregiverId_fkey') THEN
    ALTER TABLE "caregiver_relationship" ADD CONSTRAINT "caregiver_relationship_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_log_userId_fkey') THEN
    ALTER TABLE "email_log" ADD CONSTRAINT "email_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

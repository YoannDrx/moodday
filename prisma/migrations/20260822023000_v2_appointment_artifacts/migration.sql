-- Additive completion of the canonical V2 appointment aggregate.
-- Existing V2 questions remain valid because operationId is nullable.

CREATE TYPE "AppointmentEventType" AS ENUM ('preparation_started', 'question_added', 'session_started', 'session_ended', 'debriefed', 'follow_up_added');
CREATE TYPE "AppointmentDecisionStatus" AS ENUM ('open', 'completed', 'dismissed');

ALTER TABLE "v2_appointment_question" ADD COLUMN "operationId" TEXT;

CREATE TABLE "v2_appointment_event" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "type" "AppointmentEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v2_appointment_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "v2_appointment_decision" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "AppointmentDecisionStatus" NOT NULL DEFAULT 'open',
    "includeInBrief" BOOLEAN NOT NULL DEFAULT true,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_appointment_decision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "v2_appointment_decision_summary_check" CHECK (char_length(btrim("summary")) BETWEEN 1 AND 500)
);

CREATE TABLE "v2_appointment_brief" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "privateNotesExcluded" BOOLEAN NOT NULL DEFAULT true,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v2_appointment_brief_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "v2_appointment_brief_version_check" CHECK ("version" > 0),
    CONSTRAINT "v2_appointment_brief_period_check" CHECK ("periodEnd" IS NULL OR "periodStart" IS NULL OR "periodEnd" > "periodStart")
);

CREATE UNIQUE INDEX "v2_appointment_question_appointmentId_operationId_key" ON "v2_appointment_question"("appointmentId", "operationId");
CREATE UNIQUE INDEX "v2_appointment_event_appointmentId_operationId_key" ON "v2_appointment_event"("appointmentId", "operationId");
CREATE INDEX "v2_appointment_event_appointmentId_occurredAt_idx" ON "v2_appointment_event"("appointmentId", "occurredAt");
CREATE UNIQUE INDEX "v2_appointment_decision_appointmentId_operationId_key" ON "v2_appointment_decision"("appointmentId", "operationId");
CREATE INDEX "v2_appointment_decision_appointmentId_status_createdAt_idx" ON "v2_appointment_decision"("appointmentId", "status", "createdAt");
CREATE UNIQUE INDEX "v2_appointment_brief_appointmentId_operationId_key" ON "v2_appointment_brief"("appointmentId", "operationId");
CREATE UNIQUE INDEX "v2_appointment_brief_appointmentId_version_key" ON "v2_appointment_brief"("appointmentId", "version");
CREATE INDEX "v2_appointment_brief_appointmentId_createdAt_idx" ON "v2_appointment_brief"("appointmentId", "createdAt");

ALTER TABLE "v2_appointment_event" ADD CONSTRAINT "v2_appointment_event_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "v2_appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_appointment_decision" ADD CONSTRAINT "v2_appointment_decision_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "v2_appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_appointment_brief" ADD CONSTRAINT "v2_appointment_brief_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "v2_appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

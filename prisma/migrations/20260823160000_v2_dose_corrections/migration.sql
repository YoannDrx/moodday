-- V2 corrections preserve the original intake row, expose an explicit
-- cancellation state and retain bounded audit context. Every new column is
-- additive; existing intake and revision records remain valid.
ALTER TABLE "med_intake"
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "medication_intake_revision"
ADD COLUMN "operationId" TEXT,
ADD COLUMN "previousNote" TEXT,
ADD COLUMN "nextNote" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "timezone" TEXT;

CREATE UNIQUE INDEX "medication_intake_revision_actorId_operationId_key"
ON "medication_intake_revision"("actorId", "operationId");

ALTER TABLE "medication_inventory_event"
ADD COLUMN "note" TEXT;

-- Additive, content-free audit trail for intake corrections and cancellations.
-- No existing medical note or payload is copied.
CREATE TABLE "medication_intake_revision" (
  "id" TEXT NOT NULL,
  "medIntakeId" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "previousSkipped" BOOLEAN,
  "nextSkipped" BOOLEAN,
  "previousTakenAt" TIMESTAMP(3),
  "nextTakenAt" TIMESTAMP(3),
  "previousDoseIndex" INTEGER,
  "nextDoseIndex" INTEGER,
  "previousDateKey" TEXT,
  "nextDateKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medication_intake_revision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "medication_intake_revision_medicationId_createdAt_idx"
  ON "medication_intake_revision"("medicationId", "createdAt");
CREATE INDEX "medication_intake_revision_medIntakeId_createdAt_idx"
  ON "medication_intake_revision"("medIntakeId", "createdAt");

ALTER TABLE "medication_intake_revision"
  ADD CONSTRAINT "medication_intake_revision_medicationId_fkey"
  FOREIGN KEY ("medicationId") REFERENCES "medication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_intake_revision"
  ADD CONSTRAINT "medication_intake_revision_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

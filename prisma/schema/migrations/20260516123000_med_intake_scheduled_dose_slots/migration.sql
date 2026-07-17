ALTER TABLE "med_intake" ADD COLUMN "scheduledForDate" TEXT;
ALTER TABLE "med_intake" ADD COLUMN "doseIndex" INTEGER;
ALTER TABLE "med_intake" ADD COLUMN "doseKey" TEXT;

CREATE UNIQUE INDEX "med_intake_doseKey_key" ON "med_intake"("doseKey");
CREATE INDEX "med_intake_medicationId_scheduledForDate_idx" ON "med_intake"("medicationId", "scheduledForDate");
CREATE INDEX "med_intake_scheduledForDate_idx" ON "med_intake"("scheduledForDate");

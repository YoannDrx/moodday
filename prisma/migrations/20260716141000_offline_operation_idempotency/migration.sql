ALTER TABLE "mood_entry" ADD COLUMN "clientOperationId" TEXT;
ALTER TABLE "med_intake" ADD COLUMN "clientOperationId" TEXT;
ALTER TABLE "therapy_session" ADD COLUMN "clientOperationId" TEXT;
ALTER TABLE "exercise_log" ADD COLUMN "clientOperationId" TEXT;

CREATE UNIQUE INDEX "mood_entry_userId_clientOperationId_key" ON "mood_entry"("userId", "clientOperationId");
CREATE UNIQUE INDEX "med_intake_medicationId_clientOperationId_key" ON "med_intake"("medicationId", "clientOperationId");
CREATE UNIQUE INDEX "therapy_session_userId_clientOperationId_key" ON "therapy_session"("userId", "clientOperationId");
CREATE UNIQUE INDEX "exercise_log_exerciseId_clientOperationId_key" ON "exercise_log"("exerciseId", "clientOperationId");

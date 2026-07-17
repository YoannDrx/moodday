ALTER TABLE "medication" ADD COLUMN "scheduleTimes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "medication" ADD COLUMN "weeklyDay" INTEGER;
ALTER TABLE "user_preferences" ADD COLUMN "lastMedicationReminderSentKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

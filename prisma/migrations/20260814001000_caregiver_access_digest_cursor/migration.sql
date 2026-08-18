-- Additive delivery cursor for patient-facing caregiver access digests.
-- Existing users are not marked as notified; their first digest is limited to
-- the configured daily or weekly lookback window by application code.
ALTER TABLE "user_preferences"
  ADD COLUMN "lastCaregiverAccessDigestSentAt" TIMESTAMP(3);

-- Additive proof of explicit consent for the core health-data journal purpose.
-- Existing users are intentionally not backfilled and must pass the consent gate.
ALTER TYPE "ConsentPurpose" ADD VALUE IF NOT EXISTS 'health_data';

ALTER TABLE "user"
  ADD COLUMN "healthDataConsentVersionAccepted" TEXT;

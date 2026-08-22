-- Preserve the civil-time context of V2 dose events without changing legacy
-- intake semantics. Existing rows intentionally remain NULL.
ALTER TABLE "med_intake"
ADD COLUMN "timezone" TEXT;

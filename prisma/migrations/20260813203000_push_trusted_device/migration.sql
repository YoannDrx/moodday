-- Detailed notification content is permitted only after an explicit trust
-- declaration for this exact push device. Existing devices remain generic.
ALTER TABLE "push_subscription"
ADD COLUMN "trustedDevice" BOOLEAN NOT NULL DEFAULT false;

UPDATE "push_subscription"
SET "contentMode" = 'generic';

-- Preflight for the production foundation foreign keys.
-- These rows have no owning account and cannot be surfaced or attributed.
DELETE FROM "user_preferences" preferences
WHERE NOT EXISTS (
  SELECT 1 FROM "user" account WHERE account."id" = preferences."userId"
);

DELETE FROM "push_subscription" subscription
WHERE NOT EXISTS (
  SELECT 1 FROM "user" account WHERE account."id" = subscription."userId"
);

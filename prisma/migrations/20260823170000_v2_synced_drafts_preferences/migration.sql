-- Additive V2 support for cross-device drafts and accessibility preferences.
-- Existing preferences keep their current values and receive neutral defaults.
ALTER TABLE "user_preferences"
ADD COLUMN "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "preferredTextScale" TEXT NOT NULL DEFAULT 'system';

CREATE TABLE "v2_user_draft" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "contextKey" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "v2_user_draft_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "v2_user_draft_kind_check"
    CHECK ("kind" IN ('check_in', 'appointment_preparation')),
  CONSTRAINT "v2_user_draft_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "v2_user_draft_userId_kind_contextKey_key"
ON "v2_user_draft"("userId", "kind", "contextKey");

CREATE INDEX "v2_user_draft_userId_updatedAt_idx"
ON "v2_user_draft"("userId", "updatedAt");

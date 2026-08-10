ALTER TABLE "user_preferences"
  ADD COLUMN "aiInsightsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiJournalNotesEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiConsentVersion" TEXT,
  ADD COLUMN "aiConsentAt" TIMESTAMP(3);

ALTER TABLE "notification_delivery"
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "lastErrorCode" TEXT;

ALTER TABLE "subscription"
  ADD COLUMN "priceId" TEXT,
  ADD COLUMN "billingInterval" TEXT,
  ADD COLUMN "trialUsedAt" TIMESTAMP(3),
  ADD COLUMN "graceEndsAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "subscription"
SET "plan" = CASE
  WHEN "status" IN ('active', 'trialing', 'past_due') THEN 'plus'
  ELSE 'free'
END,
"trialUsedAt" = CASE
  WHEN "stripeSubscriptionId" IS NOT NULL THEN COALESCE("periodStart", CURRENT_TIMESTAMP)
  ELSE NULL
END
WHERE "plan" IN ('pro', 'ultra');

CREATE INDEX "subscription_stripeSubscriptionId_idx"
  ON "subscription"("stripeSubscriptionId");
CREATE INDEX "subscription_status_periodEnd_idx"
  ON "subscription"("status", "periodEnd");

CREATE TABLE "stripe_webhook_event" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "stripeCreatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stripe_webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_webhook_event_eventId_key"
  ON "stripe_webhook_event"("eventId");
CREATE INDEX "stripe_webhook_event_status_createdAt_idx"
  ON "stripe_webhook_event"("status", "createdAt");
CREATE INDEX "stripe_webhook_event_type_stripeCreatedAt_idx"
  ON "stripe_webhook_event"("type", "stripeCreatedAt");

CREATE TABLE "ai_usage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "latencyMs" INTEGER,
  "safetyCategory" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_usage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,
    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");
CREATE INDEX "rateLimit_lastRequest_idx" ON "rateLimit"("lastRequest");

CREATE UNIQUE INDEX "ai_usage_requestKey_key" ON "ai_usage"("requestKey");
CREATE INDEX "ai_usage_userId_periodKey_status_idx"
  ON "ai_usage"("userId", "periodKey", "status");
CREATE INDEX "ai_usage_createdAt_idx" ON "ai_usage"("createdAt");

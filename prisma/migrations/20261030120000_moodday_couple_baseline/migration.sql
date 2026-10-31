-- CreateEnum
CREATE TYPE "MooddayRole" AS ENUM ('cycle_owner', 'supporter');

-- CreateEnum
CREATE TYPE "CheckInState" AS ENUM ('ok', 'fragile', 'hard', 'very_hard');

-- CreateEnum
CREATE TYPE "CoupleLinkStatus" AS ENUM ('invited', 'active', 'ended');

-- CreateEnum
CREATE TYPE "SharingLevel" AS ENUM ('cycle_only', 'cycle_state', 'cycle_state_needs');

-- CreateEnum
CREATE TYPE "GestureStatus" AS ENUM ('sent', 'seen', 'thanked');

-- CreateEnum
CREATE TYPE "AccessAction" AS ENUM ('viewed', 'gesture_sent', 'sharing_changed', 'paused', 'resumed', 'ended');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('web', 'ios', 'android');

-- CreateEnum
CREATE TYPE "SubscriptionProvider" AS ENUM ('stripe', 'app_store', 'play_store');

-- CreateEnum
CREATE TYPE "SubscriptionSourceStatus" AS ENUM ('active', 'trialing', 'grace', 'paused', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('received', 'processed', 'ignored', 'failed');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('signup', 'onboarding', 'settings', 'migration_gate');

-- CreateEnum
CREATE TYPE "OperationalJobStatus" AS ENUM ('pending', 'processing', 'retry', 'succeeded', 'dead');

-- CreateEnum
CREATE TYPE "RegulatoryExportAuditStatus" AS ENUM ('pending', 'generated', 'delivered', 'expired', 'failed');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('age_18', 'terms', 'privacy', 'health_data', 'couple_sharing');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resendContactId" TEXT,
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "age18Accepted" BOOLEAN DEFAULT false,
    "termsVersionAccepted" TEXT,
    "privacyVersionAccepted" TEXT,
    "healthDataConsentVersionAccepted" TEXT,
    "signupLocale" TEXT DEFAULT 'fr',
    "launchCountry" TEXT DEFAULT 'FR',
    "stripeCustomerId" TEXT,
    "role" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN DEFAULT true,
    "failedVerificationCount" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN,
    "priceId" TEXT,
    "billingInterval" TEXT,
    "trialUsedAt" TIMESTAMP(3),
    "graceEndsAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "userId" TEXT NOT NULL,
    "role" "MooddayRole" NOT NULL,
    "displayName" TEXT,
    "typicalCycleLength" INTEGER,
    "typicalPeriodLength" INTEGER,
    "hardestThings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usualNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supporterFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "period" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_check_in" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "timezone" TEXT NOT NULL,
    "state" "CheckInState" NOT NULL,
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "needs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "privateNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_check_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_need" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_need_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couple_link" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "supporterId" TEXT,
    "invitedByRole" "MooddayRole" NOT NULL,
    "status" "CoupleLinkStatus" NOT NULL DEFAULT 'invited',
    "inviteCodeDigest" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "level" "SharingLevel" NOT NULL DEFAULT 'cycle_state_needs',
    "shareSymptoms" BOOLEAN NOT NULL DEFAULT false,
    "detailedPreviews" BOOLEAN NOT NULL DEFAULT false,
    "sharingVersion" INTEGER NOT NULL DEFAULT 1,
    "pausedUntil" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couple_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gesture" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "checkInId" TEXT,
    "operationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT,
    "status" "GestureStatus" NOT NULL DEFAULT 'sent',
    "seenAt" TIMESTAMP(3),
    "thankedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gesture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ally_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ally_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_email" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifecycle_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_log" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "linkId" TEXT,
    "action" "AccessAction" NOT NULL,
    "resourceKind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "displayName" TEXT,
    "pushToken" TEXT,
    "pushTokenUpdatedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_source" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SubscriptionProvider" NOT NULL,
    "externalCustomerId" TEXT,
    "externalSubscriptionId" TEXT,
    "productId" TEXT,
    "status" "SubscriptionSourceStatus" NOT NULL,
    "currentPeriodEndsAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entitlement" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "sourceProviders" "SubscriptionProvider"[] DEFAULT ARRAY[]::"SubscriptionProvider"[],
    "validUntil" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlement_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" "SubscriptionProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "BillingEventStatus" NOT NULL DEFAULT 'received',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expirationTime" TIMESTAMP(3),
    "userAgent" TEXT,
    "deviceId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "contentMode" TEXT NOT NULL DEFAULT 'generic',
    "trustedDevice" BOOLEAN NOT NULL DEFAULT false,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "email_log" (
    "id" TEXT NOT NULL,
    "resendId" TEXT,
    "recipientReference" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "version" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "country" TEXT NOT NULL DEFAULT 'FR',
    "source" "ConsentSource" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_webhook_event" (
    "id" TEXT NOT NULL,
    "svixId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "providerCreatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastErrorCode" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_job_run" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "executionKey" TEXT NOT NULL,
    "status" "OperationalJobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_job_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_heartbeat" (
    "serviceName" TEXT NOT NULL,
    "lastStartedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "alertState" TEXT NOT NULL DEFAULT 'healthy',
    "lastAlertAt" TIMESTAMP(3),
    "lastRecoveryAlertAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_heartbeat_pkey" PRIMARY KEY ("serviceName")
);

-- CreateTable
CREATE TABLE "external_deletion_job" (
    "id" TEXT NOT NULL,
    "subjectReference" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceLocator" TEXT NOT NULL,
    "status" "OperationalJobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "lastErrorCode" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_deletion_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_export_audit" (
    "id" TEXT NOT NULL,
    "requestReference" TEXT NOT NULL,
    "subjectReference" TEXT NOT NULL,
    "reviewerReference" TEXT NOT NULL,
    "status" "RegulatoryExportAuditStatus" NOT NULL DEFAULT 'pending',
    "artifactDigest" TEXT,
    "downloadTokenDigest" TEXT,
    "lastErrorCode" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_export_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "warningSigns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "copingStrategies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safePlaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trustedContacts" JSONB,
    "professionalContacts" JSONB,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "theme" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "notificationContentMode" TEXT NOT NULL DEFAULT 'generic',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyCheckInReminder" BOOLEAN NOT NULL DEFAULT true,
    "dailyCheckInTime" TEXT NOT NULL DEFAULT '19:00',
    "lastDailyCheckInSentDate" TEXT,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "lifecycleEmails" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "source" TEXT NOT NULL DEFAULT 'landing',
    "door" TEXT,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

-- CreateIndex
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

-- CreateIndex
CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- CreateIndex
CREATE INDEX "rateLimit_lastRequest_idx" ON "rateLimit"("lastRequest");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_referenceId_key" ON "subscription"("referenceId");

-- CreateIndex
CREATE INDEX "subscription_stripeSubscriptionId_idx" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_status_periodEnd_idx" ON "subscription"("status", "periodEnd");

-- CreateIndex
CREATE INDEX "period_userId_startDate_idx" ON "period"("userId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "period_userId_startDate_key" ON "period"("userId", "startDate");

-- CreateIndex
CREATE INDEX "daily_check_in_userId_localDate_idx" ON "daily_check_in"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_in_userId_localDate_key" ON "daily_check_in"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_in_userId_operationId_key" ON "daily_check_in"("userId", "operationId");

-- CreateIndex
CREATE INDEX "custom_need_userId_active_idx" ON "custom_need"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "couple_link_inviteCodeDigest_key" ON "couple_link"("inviteCodeDigest");

-- CreateIndex
CREATE INDEX "couple_link_ownerId_status_idx" ON "couple_link"("ownerId", "status");

-- CreateIndex
CREATE INDEX "couple_link_supporterId_status_idx" ON "couple_link"("supporterId", "status");

-- CreateIndex
CREATE INDEX "gesture_linkId_createdAt_idx" ON "gesture"("linkId", "createdAt");

-- CreateIndex
CREATE INDEX "gesture_recipientId_status_idx" ON "gesture"("recipientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gesture_senderId_operationId_key" ON "gesture"("senderId", "operationId");

-- CreateIndex
CREATE INDEX "ally_progress_userId_completedAt_idx" ON "ally_progress"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ally_progress_userId_lessonSlug_key" ON "ally_progress"("userId", "lessonSlug");

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_email_userId_step_key" ON "lifecycle_email"("userId", "step");

-- CreateIndex
CREATE INDEX "access_log_ownerId_createdAt_idx" ON "access_log"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "access_log_linkId_createdAt_idx" ON "access_log"("linkId", "createdAt");

-- CreateIndex
CREATE INDEX "device_userId_revokedAt_idx" ON "device"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_userId_publicId_key" ON "device"("userId", "publicId");

-- CreateIndex
CREATE INDEX "subscription_source_userId_status_idx" ON "subscription_source"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_source_provider_externalSubscriptionId_key" ON "subscription_source"("provider", "externalSubscriptionId");

-- CreateIndex
CREATE INDEX "entitlement_snapshot_userId_entitlement_calculatedAt_idx" ON "entitlement_snapshot"("userId", "entitlement", "calculatedAt");

-- CreateIndex
CREATE INDEX "billing_event_status_createdAt_idx" ON "billing_event"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_event_provider_externalEventId_key" ON "billing_event"("provider", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_endpoint_key" ON "push_subscription"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscription_userId_idx" ON "push_subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_userId_deviceId_key" ON "push_subscription"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "notification_delivery_status_claimedAt_idx" ON "notification_delivery"("status", "claimedAt");

-- CreateIndex
CREATE INDEX "notification_delivery_createdAt_idx" ON "notification_delivery"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_userId_deliveryKey_key" ON "notification_delivery"("userId", "deliveryKey");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_event_eventId_key" ON "stripe_webhook_event"("eventId");

-- CreateIndex
CREATE INDEX "stripe_webhook_event_status_createdAt_idx" ON "stripe_webhook_event"("status", "createdAt");

-- CreateIndex
CREATE INDEX "stripe_webhook_event_type_stripeCreatedAt_idx" ON "stripe_webhook_event"("type", "stripeCreatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_log_resendId_key" ON "email_log"("resendId");

-- CreateIndex
CREATE INDEX "email_log_resendId_idx" ON "email_log"("resendId");

-- CreateIndex
CREATE INDEX "email_log_recipientReference_idx" ON "email_log"("recipientReference");

-- CreateIndex
CREATE INDEX "email_log_userId_idx" ON "email_log"("userId");

-- CreateIndex
CREATE INDEX "email_log_template_idx" ON "email_log"("template");

-- CreateIndex
CREATE INDEX "email_log_status_idx" ON "email_log"("status");

-- CreateIndex
CREATE INDEX "user_consent_userId_purpose_acceptedAt_idx" ON "user_consent"("userId", "purpose", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_consent_userId_purpose_version_key" ON "user_consent"("userId", "purpose", "version");

-- CreateIndex
CREATE UNIQUE INDEX "email_webhook_event_svixId_key" ON "email_webhook_event"("svixId");

-- CreateIndex
CREATE INDEX "email_webhook_event_status_createdAt_idx" ON "email_webhook_event"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "operational_job_run_executionKey_key" ON "operational_job_run"("executionKey");

-- CreateIndex
CREATE INDEX "operational_job_run_jobName_status_nextAttemptAt_idx" ON "operational_job_run"("jobName", "status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "external_deletion_job_status_nextAttemptAt_idx" ON "external_deletion_job"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "external_deletion_job_retentionUntil_idx" ON "external_deletion_job"("retentionUntil");

-- CreateIndex
CREATE UNIQUE INDEX "external_deletion_job_subjectReference_resourceType_resourc_key" ON "external_deletion_job"("subjectReference", "resourceType", "resourceLocator");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_export_audit_requestReference_key" ON "regulatory_export_audit"("requestReference");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_export_audit_downloadTokenDigest_key" ON "regulatory_export_audit"("downloadTokenDigest");

-- CreateIndex
CREATE INDEX "regulatory_export_audit_status_createdAt_idx" ON "regulatory_export_audit"("status", "createdAt");

-- CreateIndex
CREATE INDEX "regulatory_export_audit_status_expiresAt_idx" ON "regulatory_export_audit"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "regulatory_export_audit_subjectReference_createdAt_idx" ON "regulatory_export_audit"("subjectReference", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "safety_plan_userId_key" ON "safety_plan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriber_email_idx" ON "newsletter_subscriber"("email");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period" ADD CONSTRAINT "period_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_check_in" ADD CONSTRAINT "daily_check_in_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_need" ADD CONSTRAINT "custom_need_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couple_link" ADD CONSTRAINT "couple_link_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couple_link" ADD CONSTRAINT "couple_link_supporterId_fkey" FOREIGN KEY ("supporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couple_link" ADD CONSTRAINT "couple_link_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gesture" ADD CONSTRAINT "gesture_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "couple_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gesture" ADD CONSTRAINT "gesture_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gesture" ADD CONSTRAINT "gesture_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gesture" ADD CONSTRAINT "gesture_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "daily_check_in"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ally_progress" ADD CONSTRAINT "ally_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_email" ADD CONSTRAINT "lifecycle_email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_log" ADD CONSTRAINT "access_log_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "couple_link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_source" ADD CONSTRAINT "subscription_source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_snapshot" ADD CONSTRAINT "entitlement_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_event" ADD CONSTRAINT "billing_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consent" ADD CONSTRAINT "user_consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_plan" ADD CONSTRAINT "safety_plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;


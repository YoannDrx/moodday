-- Mood Day V2 Circle is additive. No V1 caregiver table or user data is altered.

CREATE TYPE "CircleRelationshipStatus" AS ENUM ('invited', 'active', 'declined', 'expired', 'revoked');
CREATE TYPE "SharePermission" AS ENUM ('mood_summary', 'medication_adherence', 'appointments', 'support_requests', 'caregiver_observations');
CREATE TYPE "SupportRequestKind" AS ENUM ('call', 'presence', 'walk', 'meal', 'transport', 'other');
CREATE TYPE "SupportRequestStatus" AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'completed');
CREATE TYPE "CaregiverContributionKind" AS ENUM ('observation', 'event');
CREATE TYPE "CircleAccessAction" AS ENUM ('viewed', 'contributed', 'responded', 'exported', 'revoked');

CREATE TABLE "v2_circle_relationship" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT,
    "operationId" TEXT NOT NULL,
    "invitationEmail" TEXT NOT NULL,
    "invitationTokenDigest" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "CircleRelationshipStatus" NOT NULL DEFAULT 'invited',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_circle_relationship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "v2_circle_relationship_expiry_check" CHECK ("expiresAt" > "invitedAt")
);

CREATE TABLE "v2_share_contract" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "permissions" "SharePermission"[] DEFAULT ARRAY[]::"SharePermission"[],
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_share_contract_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "v2_share_contract_expiry_check" CHECK ("expiresAt" > "startsAt"),
    CONSTRAINT "v2_share_contract_version_check" CHECK ("version" > 0)
);

CREATE TABLE "v2_support_request" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT,
    "relationshipId" TEXT,
    "operationId" TEXT NOT NULL,
    "kind" "SupportRequestKind" NOT NULL,
    "message" TEXT,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'pending',
    "requestedFor" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v2_support_request_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "v2_caregiver_contribution" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "kind" "CaregiverContributionKind" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v2_caregiver_contribution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "v2_access_log" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "action" "CircleAccessAction" NOT NULL,
    "resourceKind" TEXT NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v2_access_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "v2_circle_relationship_invitationTokenDigest_key" ON "v2_circle_relationship"("invitationTokenDigest");
CREATE UNIQUE INDEX "v2_circle_relationship_patientId_operationId_key" ON "v2_circle_relationship"("patientId", "operationId");
CREATE INDEX "v2_circle_relationship_patientId_status_createdAt_idx" ON "v2_circle_relationship"("patientId", "status", "createdAt");
CREATE INDEX "v2_circle_relationship_caregiverId_status_createdAt_idx" ON "v2_circle_relationship"("caregiverId", "status", "createdAt");
CREATE INDEX "v2_circle_relationship_invitationEmail_status_idx" ON "v2_circle_relationship"("invitationEmail", "status");

CREATE UNIQUE INDEX "v2_share_contract_relationshipId_version_key" ON "v2_share_contract"("relationshipId", "version");
CREATE INDEX "v2_share_contract_relationshipId_revokedAt_expiresAt_idx" ON "v2_share_contract"("relationshipId", "revokedAt", "expiresAt");

CREATE UNIQUE INDEX "v2_support_request_patientId_operationId_key" ON "v2_support_request"("patientId", "operationId");
CREATE INDEX "v2_support_request_patientId_status_createdAt_idx" ON "v2_support_request"("patientId", "status", "createdAt");
CREATE INDEX "v2_support_request_caregiverId_status_createdAt_idx" ON "v2_support_request"("caregiverId", "status", "createdAt");

CREATE UNIQUE INDEX "v2_caregiver_contribution_authorId_operationId_key" ON "v2_caregiver_contribution"("authorId", "operationId");
CREATE INDEX "v2_caregiver_contribution_patientId_occurredAt_idx" ON "v2_caregiver_contribution"("patientId", "occurredAt");
CREATE INDEX "v2_caregiver_contribution_relationshipId_createdAt_idx" ON "v2_caregiver_contribution"("relationshipId", "createdAt");

CREATE INDEX "v2_access_log_patientId_createdAt_idx" ON "v2_access_log"("patientId", "createdAt");
CREATE INDEX "v2_access_log_actorId_createdAt_idx" ON "v2_access_log"("actorId", "createdAt");
CREATE INDEX "v2_access_log_relationshipId_createdAt_idx" ON "v2_access_log"("relationshipId", "createdAt");

ALTER TABLE "v2_circle_relationship" ADD CONSTRAINT "v2_circle_relationship_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_circle_relationship" ADD CONSTRAINT "v2_circle_relationship_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "v2_share_contract" ADD CONSTRAINT "v2_share_contract_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "v2_circle_relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_support_request" ADD CONSTRAINT "v2_support_request_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_support_request" ADD CONSTRAINT "v2_support_request_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "v2_support_request" ADD CONSTRAINT "v2_support_request_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "v2_circle_relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "v2_caregiver_contribution" ADD CONSTRAINT "v2_caregiver_contribution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_caregiver_contribution" ADD CONSTRAINT "v2_caregiver_contribution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_caregiver_contribution" ADD CONSTRAINT "v2_caregiver_contribution_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "v2_circle_relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_access_log" ADD CONSTRAINT "v2_access_log_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_access_log" ADD CONSTRAINT "v2_access_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "v2_access_log" ADD CONSTRAINT "v2_access_log_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "v2_circle_relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "v2_appointment_brief_share" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "tokenDigest" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v2_appointment_brief_share_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "v2_appointment_brief_share_tokenDigest_key"
ON "v2_appointment_brief_share"("tokenDigest");

CREATE UNIQUE INDEX "v2_appointment_brief_share_briefId_operationId_key"
ON "v2_appointment_brief_share"("briefId", "operationId");

CREATE INDEX "v2_appointment_brief_share_briefId_revokedAt_expiresAt_idx"
ON "v2_appointment_brief_share"("briefId", "revokedAt", "expiresAt");

ALTER TABLE "v2_appointment_brief_share"
ADD CONSTRAINT "v2_appointment_brief_share_briefId_fkey"
FOREIGN KEY ("briefId") REFERENCES "v2_appointment_brief"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "v2_appointment_brief_share"
ADD CONSTRAINT "v2_appointment_brief_share_expiry_check"
CHECK ("expiresAt" > "createdAt");

ALTER TABLE "v2_appointment_brief_share"
ADD CONSTRAINT "v2_appointment_brief_share_access_count_check"
CHECK ("accessCount" >= 0);

CREATE TABLE "caregiver_access_log" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "caregiverId" TEXT NOT NULL,
  "relationshipId" TEXT,
  "resource" TEXT NOT NULL,
  "accessKey" TEXT NOT NULL,
  "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "caregiver_access_log_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "caregiver_access_log_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "caregiver_access_log_caregiverId_fkey"
    FOREIGN KEY ("caregiverId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "caregiver_access_log_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "caregiver_relationship"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "caregiver_access_log_accessKey_key"
  ON "caregiver_access_log"("accessKey");

CREATE INDEX "caregiver_access_log_patientId_accessedAt_idx"
  ON "caregiver_access_log"("patientId", "accessedAt");

CREATE INDEX "caregiver_access_log_caregiverId_accessedAt_idx"
  ON "caregiver_access_log"("caregiverId", "accessedAt");

CREATE INDEX "caregiver_access_log_relationshipId_accessedAt_idx"
  ON "caregiver_access_log"("relationshipId", "accessedAt");

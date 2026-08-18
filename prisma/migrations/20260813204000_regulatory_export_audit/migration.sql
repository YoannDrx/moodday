-- Additive, content-free audit trail for separately reviewed regulatory exports.
-- Subjects and reviewers are HMAC references. Export content and artifact
-- locations are deliberately excluded from PostgreSQL.
CREATE TYPE "RegulatoryExportAuditStatus" AS ENUM (
  'pending',
  'generated',
  'delivered',
  'expired',
  'failed'
);

CREATE TABLE "regulatory_export_audit" (
  "id" TEXT NOT NULL,
  "requestReference" TEXT NOT NULL,
  "subjectReference" TEXT NOT NULL,
  "reviewerReference" TEXT NOT NULL,
  "status" "RegulatoryExportAuditStatus" NOT NULL DEFAULT 'pending',
  "artifactDigest" TEXT,
  "lastErrorCode" TEXT,
  "approvedAt" TIMESTAMP(3) NOT NULL,
  "generatedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "regulatory_export_audit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regulatory_export_audit_requestReference_key"
  ON "regulatory_export_audit"("requestReference");
CREATE INDEX "regulatory_export_audit_status_createdAt_idx"
  ON "regulatory_export_audit"("status", "createdAt");
CREATE INDEX "regulatory_export_audit_subjectReference_createdAt_idx"
  ON "regulatory_export_audit"("subjectReference", "createdAt");

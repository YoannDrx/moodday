-- Additive delivery metadata for one-time private regulatory export links.
-- Only an HMAC digest of the download token is retained.
ALTER TABLE "regulatory_export_audit"
  ADD COLUMN "downloadTokenDigest" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "regulatory_export_audit_downloadTokenDigest_key"
  ON "regulatory_export_audit"("downloadTokenDigest");
CREATE INDEX "regulatory_export_audit_status_expiresAt_idx"
  ON "regulatory_export_audit"("status", "expiresAt");

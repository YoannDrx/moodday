ALTER TABLE "email_log"
ADD COLUMN "recipientReference" TEXT;

UPDATE "email_log"
SET
  "to" = '[redacted]',
  "subject" = "template",
  "metadata" = NULL,
  "error" = CASE WHEN "error" IS NULL THEN NULL ELSE 'provider_error' END;

CREATE INDEX "email_log_recipientReference_idx"
ON "email_log"("recipientReference");

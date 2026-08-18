-- PostgreSQL truncated these historical identifiers differently from Prisma's
-- generated 63-character names. Renaming is metadata-only and non-destructive.
ALTER INDEX IF EXISTS "external_deletion_job_subjectReference_resourceType_resourceLoc"
  RENAME TO "external_deletion_job_subjectReference_resourceType_resourc_key";
ALTER INDEX IF EXISTS "medication_schedule_revision_medicationId_effectiveDate_created"
  RENAME TO "medication_schedule_revision_medicationId_effectiveDate_cre_key";

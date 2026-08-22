-- One routine can have at most one canonical occurrence per civil day.
-- Abort explicitly if historical duplicates exist instead of deleting data.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "v2_routine_occurrence"
    GROUP BY "routineId", "localDate"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate v2 routine occurrences must be resolved before migration';
  END IF;
END $$;

CREATE UNIQUE INDEX "v2_routine_occurrence_routineId_localDate_key"
  ON "v2_routine_occurrence"("routineId", "localDate");

ALTER TABLE "v2_routine_occurrence"
  ADD CONSTRAINT "v2_routine_occurrence_local_date_check"
  CHECK ("localDate" ~ '^\d{4}-\d{2}-\d{2}$'),
  ADD CONSTRAINT "v2_routine_occurrence_timezone_check"
  CHECK (char_length(btrim("timezone")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "v2_routine_occurrence_note_check"
  CHECK ("note" IS NULL OR char_length("note") <= 1000);

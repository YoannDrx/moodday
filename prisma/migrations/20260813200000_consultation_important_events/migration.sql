ALTER TABLE "consultation_preparation"
ADD COLUMN "importantEvents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

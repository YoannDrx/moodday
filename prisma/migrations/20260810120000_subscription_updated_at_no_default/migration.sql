-- Prisma's @updatedAt manages this value in application writes. The previous
-- operational baseline introduced a database default only for its backfill.
ALTER TABLE "subscription" ALTER COLUMN "updatedAt" DROP DEFAULT;

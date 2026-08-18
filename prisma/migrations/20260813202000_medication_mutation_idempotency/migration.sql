-- Content-free receipts make medication mutations safe to retry after an
-- ambiguous network response without retaining the submitted health payload.
CREATE TABLE "medication_mutation_receipt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "mutationType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medication_mutation_receipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "medication_mutation_receipt_userId_operationId_key"
  ON "medication_mutation_receipt"("userId", "operationId");
CREATE INDEX "medication_mutation_receipt_medicationId_idx"
  ON "medication_mutation_receipt"("medicationId");
CREATE INDEX "medication_mutation_receipt_createdAt_idx"
  ON "medication_mutation_receipt"("createdAt");

ALTER TABLE "medication_mutation_receipt"
  ADD CONSTRAINT "medication_mutation_receipt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_mutation_receipt"
  ADD CONSTRAINT "medication_mutation_receipt_medicationId_fkey"
  FOREIGN KEY ("medicationId") REFERENCES "medication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

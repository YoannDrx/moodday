CREATE TABLE "notification_delivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deliveryKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_delivery_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notification_delivery_userId_deliveryKey_key"
  ON "notification_delivery"("userId", "deliveryKey");

CREATE INDEX "notification_delivery_status_claimedAt_idx"
  ON "notification_delivery"("status", "claimedAt");

CREATE INDEX "notification_delivery_createdAt_idx"
  ON "notification_delivery"("createdAt");

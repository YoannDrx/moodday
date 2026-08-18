import { prisma } from "@/lib/prisma";

const readArgument = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
};

async function main() {
  const deliveryId = readArgument("--delivery-id");
  const confirmation = readArgument("--confirm");

  if (!deliveryId || confirmation !== "RETRY_DEAD_DELIVERY") {
    throw new Error(
      "Usage: pnpm notifications:retry-dead --delivery-id <id> --confirm RETRY_DEAD_DELIVERY",
    );
  }

  const result = await prisma.notificationDelivery.updateMany({
    where: { id: deliveryId, status: "dead" },
    data: {
      status: "failed",
      attempts: 0,
      nextAttemptAt: new Date(),
      failedAt: null,
      lastErrorCode: "manual_retry_requested",
    },
  });

  if (result.count !== 1) {
    throw new Error("No dead notification matched the supplied identifier");
  }

  process.stdout.write("One dead notification was scheduled for retry.\n");
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        eventName: "dead_notification_retry_failed",
        errorCode: error instanceof Error ? error.name : "unknown_error",
      })}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

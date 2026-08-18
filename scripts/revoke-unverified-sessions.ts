import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.session.deleteMany({
    where: { user: { emailVerified: false } },
  });
  process.stdout.write(
    `${JSON.stringify({ eventName: "unverified_sessions_revoked", count: result.count })}\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        eventName: "unverified_sessions_revoke_failed",
        errorCode: error instanceof Error ? error.name : "unknown_error",
      })}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

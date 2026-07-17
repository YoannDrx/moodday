import { prisma } from "@/lib/prisma";

async function globalTeardown() {
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        contains: "playwright-test-",
      },
    },
  });

  // eslint-disable-next-line no-console
  console.info(`Cleanup ${result.count} test users`);
}

export default globalTeardown;

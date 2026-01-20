import { logger } from "@/lib/logger";
import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
import { prisma } from "../src/lib/prisma";

// Set seed for reproducibility
faker.seed(123);

async function main() {
  logger.info("🌱 Seeding database...");

  // Create 10 users with subscriptions
  const userCreatePromises = Array.from({ length: 10 }, async (_, index) => {
    const email = faker.internet.email();
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: nanoid(11),
        name: faker.person.fullName(),
        email,
        emailVerified: faker.datatype.boolean(0.8), // 80% chance of being verified
        image: faker.image.avatar(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        stripeCustomerId: `cus_${nanoid(14)}`, // Mock Stripe customer ID
      },
    });

    // Create subscription for some users (30% chance)
    if (faker.datatype.boolean(0.3)) {
      const plans = ["free", "pro", "ultra"];
      const selectedPlan = faker.helpers.arrayElement(plans);

      await prisma.subscription.upsert({
        where: { referenceId: user.id },
        update: {},
        create: {
          id: `sub_${Date.now()}_${index}`,
          plan: selectedPlan,
          referenceId: user.id,
          stripeCustomerId: user.stripeCustomerId ?? `cus_${nanoid(14)}`,
          stripeSubscriptionId: `sub_${nanoid(14)}`,
          status: faker.helpers.arrayElement([
            "active",
            "canceled",
            "past_due",
          ]),
          periodStart: faker.date.past({ years: 1 }),
          periodEnd: faker.date.future({ years: 1 }),
          cancelAtPeriodEnd: faker.datatype.boolean(0.2),
        },
      });

      logger.info(
        `💳 Created subscription for user: ${user.name} (${selectedPlan})`,
      );
    }

    return user;
  });

  const users = await Promise.all(userCreatePromises);
  users.forEach((user) => logger.info(`👤 Created user: ${user.name}`));

  // Create some feedback entries
  const feedbackPromises = Array.from({ length: 15 }, async () => {
    const user = faker.helpers.arrayElement(users);
    return prisma.feedback.upsert({
      where: { id: nanoid(11) },
      update: {},
      create: {
        id: nanoid(11),
        review: faker.number.int({ min: 1, max: 5 }),
        message: faker.lorem.sentences({ min: 1, max: 3 }),
        email: faker.datatype.boolean(0.5) ? faker.internet.email() : null,
        userId: faker.datatype.boolean(0.7) ? user.id : null,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
  });

  const feedbacks = await Promise.all(feedbackPromises);
  logger.info(`💬 Created ${feedbacks.length} feedback entries`);

  logger.info("✅ Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

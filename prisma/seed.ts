import { logger } from "@/lib/logger";
import { addDays, civilDateInTimeZone } from "@moodday/domain";
import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { prisma } from "../src/lib/prisma";

// Local demo duo. These are development-only credentials for a disposable
// database; never run this seed against a shared or production database.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "moodday-demo-2026";
const TIME_ZONE = "Europe/Paris";

const createDemoUser = async (email: string, name: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: nanoid(16),
      email,
      name,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      age18Accepted: true,
      termsVersionAccepted: process.env.LEGAL_TERMS_VERSION ?? "terms-2026-11",
      privacyVersionAccepted:
        process.env.LEGAL_PRIVACY_VERSION ?? "privacy-2026-11",
      healthDataConsentVersionAccepted:
        process.env.HEALTH_DATA_CONSENT_VERSION ?? "health-data-2026-11",
      accounts: {
        create: {
          id: nanoid(16),
          accountId: email,
          providerId: "credential",
          password: await hashPassword(DEMO_PASSWORD),
          createdAt: now,
          updatedAt: now,
        },
      },
      preferences: {
        create: { timezone: TIME_ZONE, hasCompletedOnboarding: true },
      },
    },
  });

  await prisma.userConsent.createMany({
    data: [
      { purpose: "age_18", version: "18" },
      {
        purpose: "terms",
        version: process.env.LEGAL_TERMS_VERSION ?? "terms-2026-11",
      },
      {
        purpose: "privacy",
        version: process.env.LEGAL_PRIVACY_VERSION ?? "privacy-2026-11",
      },
      {
        purpose: "health_data",
        version:
          process.env.HEALTH_DATA_CONSENT_VERSION ?? "health-data-2026-11",
      },
    ].map((consent) => ({
      ...consent,
      purpose: consent.purpose as
        | "age_18"
        | "terms"
        | "privacy"
        | "health_data",
      userId: user.id,
      source: "signup" as const,
    })),
    skipDuplicates: true,
  });

  return user;
};

async function main() {
  logger.info("🌱 Seeding a demo duo...");
  const today = civilDateInTimeZone(new Date(), TIME_ZONE);
  const lea = await createDemoUser("lea@moodday.test", "Léa Martin");
  const tom = await createDemoUser("tom@moodday.test", "Tom Bernard");

  await prisma.profile.upsert({
    where: { userId: lea.id },
    update: {},
    create: {
      userId: lea.id,
      role: "cycle_owner",
      displayName: "Léa",
      typicalCycleLength: 29,
      typicalPeriodLength: 5,
      hardestThings: ["irritability", "fatigue", "cramps"],
      usualNeeds: ["calm", "dinner", "hot_water_bottle"],
      onboardedAt: new Date(),
    },
  });
  await prisma.profile.upsert({
    where: { userId: tom.id },
    update: {},
    create: {
      userId: tom.id,
      role: "supporter",
      displayName: "Tom",
      supporterFocus: ["words", "help"],
      onboardedAt: new Date(),
    },
  });

  // Three past cycles of 29 days, the current one on day 25.
  const currentStart = addDays(today, -24);
  for (let index = 0; index < 4; index += 1) {
    const start = addDays(currentStart, -29 * index);
    // eslint-disable-next-line no-await-in-loop -- tiny fixed seed
    await prisma.period.upsert({
      where: {
        userId_startDate: {
          userId: lea.id,
          startDate: new Date(`${start}T00:00:00.000Z`),
        },
      },
      update: {},
      create: {
        userId: lea.id,
        startDate: new Date(`${start}T00:00:00.000Z`),
        endDate: new Date(`${addDays(start, 4)}T00:00:00.000Z`),
      },
    });
  }

  // Difficult days in the five days before each past period.
  for (let index = 1; index < 4; index += 1) {
    const nextStart = addDays(currentStart, -29 * (index - 1));
    for (let offset = 1; offset <= 9; offset += 1) {
      const localDate = addDays(nextStart, -offset);
      // eslint-disable-next-line no-await-in-loop -- tiny fixed seed
      await prisma.dailyCheckIn.upsert({
        where: {
          userId_localDate: {
            userId: lea.id,
            localDate: new Date(`${localDate}T00:00:00.000Z`),
          },
        },
        update: {},
        create: {
          userId: lea.id,
          operationId: `seed-${localDate}`,
          localDate: new Date(`${localDate}T00:00:00.000Z`),
          timezone: TIME_ZONE,
          state: offset <= 5 ? (offset <= 2 ? "hard" : "fragile") : "ok",
          symptoms: offset <= 5 ? ["irritability", "fatigue"] : [],
          needs: offset <= 5 ? ["calm"] : [],
        },
      });
    }
  }

  const link = await prisma.coupleLink.findFirst({
    where: { ownerId: lea.id, supporterId: tom.id, status: "active" },
  });
  if (!link) {
    await prisma.coupleLink.create({
      data: {
        ownerId: lea.id,
        supporterId: tom.id,
        invitedByRole: "cycle_owner",
        status: "active",
        acceptedAt: new Date(),
      },
    });
  }

  logger.info("✅ Demo duo ready: lea@moodday.test and tom@moodday.test");
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

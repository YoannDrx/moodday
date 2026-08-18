import { prisma } from "@/lib/prisma";
import { hashPassword } from "better-auth/crypto";

const requireFixtureValue = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const assertDisposableDatabase = (databaseUrl: string) => {
  const parsed = new URL(databaseUrl);
  const isLoopback = ["127.0.0.1", "localhost", "::1"].includes(
    parsed.hostname,
  );
  const databaseName = parsed.pathname.slice(1).toLowerCase();

  if (
    process.env.LIGHTHOUSE_TEST_MODE !== "true" ||
    !isLoopback ||
    !databaseName.includes("moodday")
  ) {
    throw new Error(
      "Lighthouse fixtures are restricted to an explicit local disposable Moodday database",
    );
  }
};

const main = async () => {
  const databaseUrl = requireFixtureValue("DATABASE_URL");
  const email = requireFixtureValue("LIGHTHOUSE_USER_EMAIL").toLowerCase();
  const password = requireFixtureValue("LIGHTHOUSE_USER_PASSWORD");
  const termsVersion = requireFixtureValue("LEGAL_TERMS_VERSION");
  const privacyVersion = requireFixtureValue("LEGAL_PRIVACY_VERSION");
  const healthDataConsentVersion = requireFixtureValue(
    "HEALTH_DATA_CONSENT_VERSION",
  );

  assertDisposableDatabase(databaseUrl);
  if (!email.startsWith("playwright-test-") || password.length < 12) {
    throw new Error("Unsafe Lighthouse fixture credentials");
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: true,
          age18Accepted: true,
          termsVersionAccepted: termsVersion,
          privacyVersionAccepted: privacyVersion,
          healthDataConsentVersionAccepted: healthDataConsentVersion,
          signupLocale: "fr",
          launchCountry: "FR",
        },
      })
    : await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: "Lighthouse Fixture",
          email,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
          age18Accepted: true,
          termsVersionAccepted: termsVersion,
          privacyVersionAccepted: privacyVersion,
          healthDataConsentVersionAccepted: healthDataConsentVersion,
          signupLocale: "fr",
          launchCountry: "FR",
        },
      });

  const credentialAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });
  if (credentialAccount) {
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: { password: passwordHash, updatedAt: now },
    });
  } else {
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        hasCompletedOnboarding: true,
        locale: "fr",
        timezone: "Europe/Paris",
      },
      update: {
        hasCompletedOnboarding: true,
        locale: "fr",
        timezone: "Europe/Paris",
      },
    }),
    prisma.userConsent.createMany({
      data: [
        {
          userId: user.id,
          purpose: "age_18",
          version: "18",
          locale: "fr",
          country: "FR",
          source: "signup",
        },
        {
          userId: user.id,
          purpose: "terms",
          version: termsVersion,
          locale: "fr",
          country: "FR",
          source: "signup",
        },
        {
          userId: user.id,
          purpose: "privacy",
          version: privacyVersion,
          locale: "fr",
          country: "FR",
          source: "signup",
        },
        {
          userId: user.id,
          purpose: "health_data",
          version: healthDataConsentVersion,
          locale: "fr",
          country: "FR",
          source: "signup",
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  process.stdout.write("Lighthouse fixture prepared in disposable database.\n");
};

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Lighthouse fixture failed"}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

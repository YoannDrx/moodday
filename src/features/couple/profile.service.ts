import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  MooddayRole,
  OwnerOnboardingInput,
  SupporterOnboardingInput,
} from "@moodday/contracts";
import { needCatalog, symptomCatalog } from "@moodday/domain";
import { CoupleError, fromCivil } from "./shared";

const knownNeeds = new Set<string>(needCatalog.map((need) => need.key));
const knownSymptoms = new Set<string>(symptomCatalog.map((item) => item.key));
export const supporterFocusOptions = [
  { key: "understand", label: "Comprendre ce qui se passe vraiment" },
  { key: "words", label: "Savoir quoi dire (et quoi éviter)" },
  { key: "help", label: "Aider concrètement, sans en faire trop" },
  { key: "arguments", label: "Éviter la dispute du mois" },
  { key: "serious", label: "Repérer quand ça devient sérieux" },
] as const;
const knownFocus = new Set<string>(
  supporterFocusOptions.map((item) => item.key),
);

export const chooseRole = async (userId: string, role: MooddayRole) => {
  const openLink = await prisma.coupleLink.findFirst({
    where: {
      status: "active",
      OR: [{ ownerId: userId }, { supporterId: userId }],
    },
    select: { id: true },
  });
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing && existing.role !== role && openLink) {
    throw new CoupleError(
      "role_locked",
      "Arrête d'abord le partage en cours avant de changer de rôle.",
    );
  }

  return prisma.profile.upsert({
    where: { userId },
    create: { userId, role },
    update: existing?.role === role ? {} : { role, onboardedAt: null },
  });
};

export const completeOwnerOnboarding = async (
  userId: string,
  input: OwnerOnboardingInput,
) => {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile?.role !== "cycle_owner") {
    throw new CoupleError("wrong_role", "Ce parcours est réservé à son cycle.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        typicalCycleLength: input.typicalCycleLength,
        typicalPeriodLength: input.typicalPeriodLength,
        hardestThings: input.hardestThings.filter((key) =>
          knownSymptoms.has(key),
        ),
        usualNeeds: input.usualNeeds.filter((key) => knownNeeds.has(key)),
        onboardedAt: new Date(),
      },
    });
    if (input.lastPeriodStart) {
      const endDate = new Date(fromCivil(input.lastPeriodStart));
      endDate.setUTCDate(
        endDate.getUTCDate() + (input.typicalPeriodLength ?? 5) - 1,
      );
      await tx.period.upsert({
        where: {
          userId_startDate: {
            userId,
            startDate: fromCivil(input.lastPeriodStart),
          },
        },
        create: {
          userId,
          startDate: fromCivil(input.lastPeriodStart),
          endDate: endDate <= new Date() ? endDate : null,
        },
        update: {},
      });
    }
    await tx.userPreferences.upsert({
      where: { userId },
      create: { userId, hasCompletedOnboarding: true },
      update: { hasCompletedOnboarding: true },
    });
  });
};

export const completeSupporterOnboarding = async (
  userId: string,
  input: SupporterOnboardingInput,
) => {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile?.role !== "supporter") {
    throw new CoupleError(
      "wrong_role",
      "Ce parcours est réservé au partenaire qui soutient.",
    );
  }
  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        supporterFocus: input.supporterFocus.filter((key) =>
          knownFocus.has(key),
        ),
        onboardedAt: new Date(),
      },
    }),
    prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, hasCompletedOnboarding: true },
      update: { hasCompletedOnboarding: true },
    }),
  ]);
};

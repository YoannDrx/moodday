import "server-only";

import {
  safetyPlanContactSchema,
  type SafetyPlanContact,
  type SafetyPlanDto,
  type SafetyPlanWriteInput,
} from "@moodday/contracts";
import type { Prisma, SafetyPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const parseContacts = (value: Prisma.JsonValue | null): SafetyPlanContact[] => {
  const parsed = safetyPlanContactSchema.array().max(10).safeParse(value);
  return parsed.success ? parsed.data : [];
};

export const toSafetyPlanDto = (plan: SafetyPlan): SafetyPlanDto => ({
  id: plan.id,
  warningSigns: plan.warningSigns,
  copingStrategies: plan.copingStrategies,
  safePlaces: plan.safePlaces,
  trustedContacts: parseContacts(plan.trustedContacts),
  professionalContacts: parseContacts(plan.professionalContacts),
  lastReviewedAt: plan.lastReviewedAt?.toISOString() ?? null,
  createdAt: plan.createdAt.toISOString(),
  updatedAt: plan.updatedAt.toISOString(),
});

export const getSafetyPlan = async (
  userId: string,
): Promise<SafetyPlanDto | null> => {
  const plan = await prisma.safetyPlan.findUnique({ where: { userId } });
  return plan ? toSafetyPlanDto(plan) : null;
};

export const saveSafetyPlan = async (
  userId: string,
  input: SafetyPlanWriteInput,
): Promise<SafetyPlanDto> => {
  const plan = await prisma.safetyPlan.upsert({
    where: { userId },
    create: {
      userId,
      warningSigns: input.warningSigns,
      copingStrategies: input.copingStrategies,
      safePlaces: input.safePlaces,
      trustedContacts: input.trustedContacts,
      professionalContacts: input.professionalContacts,
      lastReviewedAt: input.markReviewed ? new Date() : null,
    },
    update: {
      warningSigns: input.warningSigns,
      copingStrategies: input.copingStrategies,
      safePlaces: input.safePlaces,
      trustedContacts: input.trustedContacts,
      professionalContacts: input.professionalContacts,
      ...(input.markReviewed ? { lastReviewedAt: new Date() } : {}),
    },
  });
  return toSafetyPlanDto(plan);
};

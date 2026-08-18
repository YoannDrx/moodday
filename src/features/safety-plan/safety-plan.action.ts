"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shortText = z.string().trim().min(1).max(500);
const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  detail: z.string().trim().min(1).max(200),
});

const safetyPlanSchema = z.object({
  warningSigns: z.array(shortText).max(20),
  copingStrategies: z.array(shortText).max(20),
  safePlaces: z.array(shortText).max(20),
  trustedContacts: z.array(contactSchema).max(10),
  professionalContacts: z.array(contactSchema).max(10),
  markReviewed: z.boolean().default(false),
});

export const getSafetyPlan = authAction.action(async ({ ctx: { user } }) =>
  prisma.safetyPlan.findUnique({ where: { userId: user.id } }),
);

export const saveSafetyPlan = authAction
  .inputSchema(safetyPlanSchema)
  .action(async ({ parsedInput, ctx: { user } }) =>
    prisma.safetyPlan.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        warningSigns: parsedInput.warningSigns,
        copingStrategies: parsedInput.copingStrategies,
        safePlaces: parsedInput.safePlaces,
        trustedContacts: parsedInput.trustedContacts,
        professionalContacts: parsedInput.professionalContacts,
        lastReviewedAt: parsedInput.markReviewed ? new Date() : null,
      },
      update: {
        warningSigns: parsedInput.warningSigns,
        copingStrategies: parsedInput.copingStrategies,
        safePlaces: parsedInput.safePlaces,
        trustedContacts: parsedInput.trustedContacts,
        professionalContacts: parsedInput.professionalContacts,
        ...(parsedInput.markReviewed ? { lastReviewedAt: new Date() } : {}),
      },
    }),
  );

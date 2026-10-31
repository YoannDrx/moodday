"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Get or create user preferences
export const getUserPreferences = authAction.action(
  async ({ ctx: { user } }) => {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    preferences ??= await prisma.userPreferences.create({
      data: { userId: user.id },
    });

    return preferences;
  },
);

// Complete onboarding
export const completeOnboarding = authAction.action(
  async ({ ctx: { user } }) => {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        hasCompletedOnboarding: true,
      },
      create: {
        userId: user.id,
        hasCompletedOnboarding: true,
      },
    });

    return preferences;
  },
);

// Update display preferences
const updateDisplayPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  locale: z.enum(["fr", "en"]).optional(),
  reducedMotion: z.boolean().optional(),
});

export const updateDisplayPreferences = authAction
  .inputSchema(updateDisplayPreferencesSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: parsedInput,
      create: {
        userId: user.id,
        ...parsedInput,
      },
    });

    return preferences;
  });

// Update notification preferences
const timePreferenceSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const updateNotificationPreferencesSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  dailyCheckInReminder: z.boolean().optional(),
  dailyCheckInTime: timePreferenceSchema.optional(),
  quietHoursStart: timePreferenceSchema.optional(),
  quietHoursEnd: timePreferenceSchema.optional(),
});

export const updateNotificationPreferences = authAction
  .inputSchema(updateNotificationPreferencesSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: parsedInput,
      create: {
        userId: user.id,
        ...parsedInput,
      },
    });

    return preferences;
  });

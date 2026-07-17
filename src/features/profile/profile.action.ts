"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { deleteUserDataBeforeAccountDeletion } from "@/lib/user/delete-user-data";
import {
  purgeUserProfileImage,
  replaceUserProfileImage,
} from "./profile-image";
import { z } from "zod";

// ===== Update Profile =====

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  // Image can be a valid URL, an empty string (to remove), or undefined (to keep unchanged)
  image: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((val) => (val === "" ? null : val)),
});

export const updateProfile = authAction
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput: { name, timezone, image }, ctx: { user } }) => {
    const updateData: { name?: string; image?: string | null } = {};
    const preferencesUpdate: { timezone?: string } = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (timezone !== undefined) {
      preferencesUpdate.timezone = timezone;
    }
    if (image !== undefined) {
      updateData.image = image;
    }

    if (image !== undefined) {
      await replaceUserProfileImage({ userId: user.id, nextImage: image });
      delete updateData.image;
    }

    const updatedUser =
      Object.keys(updateData).length > 0
        ? await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          })
        : await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          });

    if (Object.keys(preferencesUpdate).length > 0) {
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...preferencesUpdate,
        },
        update: preferencesUpdate,
      });
    }

    return updatedUser;
  });

// ===== Delete Account =====

export const deleteAccount = authAction.action(async ({ ctx: { user } }) => {
  await purgeUserProfileImage(user.id);
  await deleteUserDataBeforeAccountDeletion(user);

  // Delete user (cascade will handle the rest)
  await prisma.user.delete({
    where: { id: user.id },
  });

  return { success: true };
});

// ===== Subscription Summary =====

export const getSubscriptionSummary = authAction.action(
  async ({ ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });

    if (!subscription) {
      return null;
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      periodStart: subscription.periodStart?.toISOString() ?? null,
      periodEnd: subscription.periodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
    };
  },
);

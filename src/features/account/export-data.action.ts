"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";

export const exportUserData = authAction.action(async ({ ctx: { user } }) => {
  // Fetch complete user profile
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Build export data structure
  // Note: MoodEntry, Medication, etc. will be added when those models exist
  const exportData = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      dataVersion: "1.0",
      applicationName: "Moodday",
      userId: user.id,
    },
    user: userProfile,
    // These will be populated as we implement other epics
    moodEntries: [],
    medications: [],
    medicationIntakes: [],
    therapySessions: [],
    exercises: [],
    exerciseLogs: [],
  };

  return exportData;
});

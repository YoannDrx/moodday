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

  // Fetch mood entries
  const moodEntries = await prisma.moodEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Fetch medications with their intakes and history
  const medications = await prisma.medication.findMany({
    where: { userId: user.id },
    include: {
      intakes: {
        orderBy: { takenAt: "desc" },
      },
      history: {
        orderBy: { changedAt: "desc" },
      },
    },
  });

  // Build export data structure
  const exportData = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      dataVersion: "1.0",
      applicationName: "Moodday",
      userId: user.id,
    },
    user: userProfile,
    moodEntries,
    medications,
    // These will be populated as we implement other epics
    therapySessions: [],
    exercises: [],
    exerciseLogs: [],
  };

  return exportData;
});

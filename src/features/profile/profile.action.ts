"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ===== Update Profile =====

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  image: z.string().url().optional(),
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
  // Delete all user data in order (cascade should handle most, but being explicit)

  // Delete caregiver relationships
  await prisma.caregiverRelationship.deleteMany({
    where: {
      OR: [{ patientId: user.id }, { caregiverId: user.id }],
    },
  });

  // Delete caregiver observations
  await prisma.caregiverObservation.deleteMany({
    where: {
      OR: [{ observerId: user.id }, { subjectId: user.id }],
    },
  });

  // Delete caregiver events
  await prisma.caregiverEvent.deleteMany({
    where: {
      OR: [{ reporterId: user.id }, { subjectId: user.id }],
    },
  });

  // Delete user (cascade will handle the rest)
  await prisma.user.delete({
    where: { id: user.id },
  });

  return { success: true };
});

// ===== Export All User Data (RGPD) =====

export const exportUserData = authAction.action(async ({ ctx: { user } }) => {
  // Fetch all user data for RGPD export

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
    },
  });

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
  });

  const moodEntries = await prisma.moodEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const medications = await prisma.medication.findMany({
    where: { userId: user.id },
    include: {
      intakes: true,
      history: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const therapySessions = await prisma.therapySession.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  const exercises = await prisma.exercise.findMany({
    where: { userId: user.id },
    include: {
      logs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const caregiverObservationsMade = await prisma.caregiverObservation.findMany({
    where: { observerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const caregiverObservationsReceived =
    await prisma.caregiverObservation.findMany({
      where: { subjectId: user.id },
      orderBy: { createdAt: "desc" },
    });

  const caregiverEventsReported = await prisma.caregiverEvent.findMany({
    where: { reporterId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const caregiverEventsAbout = await prisma.caregiverEvent.findMany({
    where: { subjectId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const caregiverRelationships = await prisma.caregiverRelationship.findMany({
    where: {
      OR: [{ patientId: user.id }, { caregiverId: user.id }],
    },
  });

  return {
    exportDate: new Date().toISOString(),
    user: userData,
    preferences,
    moodEntries: moodEntries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    medications: medications.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      intakes: m.intakes.map((i) => ({
        ...i,
        takenAt: i.takenAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      })),
      history: m.history.map((h) => ({
        ...h,
        changedAt: h.changedAt.toISOString(),
      })),
    })),
    therapySessions: therapySessions.map((s) => ({
      ...s,
      date: s.date.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    exercises: exercises.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      logs: e.logs.map((l) => ({
        ...l,
        completedAt: l.completedAt.toISOString(),
        createdAt: l.createdAt.toISOString(),
      })),
    })),
    caregiverData: {
      observationsMade: caregiverObservationsMade.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      observationsReceived: caregiverObservationsReceived.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      eventsReported: caregiverEventsReported.map((e) => ({
        ...e,
        eventDate: e.eventDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      eventsAbout: caregiverEventsAbout.map((e) => ({
        ...e,
        eventDate: e.eventDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      relationships: caregiverRelationships.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        inviteExpiry: r.inviteExpiry?.toISOString() ?? null,
      })),
    },
  };
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

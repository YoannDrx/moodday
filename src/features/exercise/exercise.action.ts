"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ===== Exercise Actions =====

const createExerciseSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
});

const updateExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional().nullable(),
});

const getExercisesSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

export const createExercise = authAction
  .inputSchema(createExerciseSchema)
  .action(async ({ parsedInput: { name, description }, ctx: { user } }) => {
    const exercise = await prisma.exercise.create({
      data: {
        userId: user.id,
        name,
        description,
        syncStatus: "synced",
      },
    });

    return exercise;
  });

export const updateExercise = authAction
  .inputSchema(updateExerciseSchema)
  .action(async ({ parsedInput: { id, name, description }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.exercise.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Exercise not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only edit your own exercises");
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: { name, description },
    });

    return exercise;
  });

export const archiveExercise = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.exercise.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Exercise not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only archive your own exercises");
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: { isArchived: true },
    });

    return exercise;
  });

export const unarchiveExercise = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.exercise.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Exercise not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only unarchive your own exercises");
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: { isArchived: false },
    });

    return exercise;
  });

export const getExercises = authAction
  .inputSchema(getExercisesSchema)
  .action(async ({ parsedInput: { includeArchived }, ctx: { user } }) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const exercises = await prisma.exercise.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        logs: {
          where: {
            completedAt: { gte: startOfDay },
          },
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return exercises;
  });

export const getExerciseById = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { completedAt: "desc" },
          take: 30,
        },
      },
    });

    if (!exercise) {
      throw new ActionError("Exercise not found");
    }

    if (exercise.userId !== user.id) {
      throw new ActionError("You can only view your own exercises");
    }

    return exercise;
  });

// ===== Exercise Log Actions =====

const logExerciseSchema = z.object({
  exerciseId: z.string(),
  note: z.string().optional(),
});

export const logExerciseCompletion = authAction
  .inputSchema(logExerciseSchema)
  .action(async ({ parsedInput: { exerciseId, note }, ctx: { user } }) => {
    // Verify ownership
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { userId: true },
    });

    if (!exercise) {
      throw new ActionError("Exercise not found");
    }

    if (exercise.userId !== user.id) {
      throw new ActionError("You can only log your own exercises");
    }

    const log = await prisma.exerciseLog.create({
      data: {
        exerciseId,
        completedAt: new Date(),
        note,
      },
    });

    return log;
  });

export const deleteExerciseLog = authAction
  .inputSchema(z.object({ logId: z.string() }))
  .action(async ({ parsedInput: { logId }, ctx: { user } }) => {
    // Verify ownership through exercise
    const log = await prisma.exerciseLog.findUnique({
      where: { id: logId },
      include: {
        exercise: {
          select: { userId: true },
        },
      },
    });

    if (!log) {
      throw new ActionError("Log not found");
    }

    if (log.exercise.userId !== user.id) {
      throw new ActionError("You can only delete your own exercise logs");
    }

    await prisma.exerciseLog.delete({
      where: { id: logId },
    });

    return { success: true };
  });

export const getExerciseHistory = authAction
  .inputSchema(
    z.object({
      exerciseId: z.string(),
      days: z.number().optional().default(30),
    }),
  )
  .action(async ({ parsedInput: { exerciseId, days }, ctx: { user } }) => {
    // Verify ownership
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { userId: true },
    });

    if (!exercise) {
      throw new ActionError("Exercise not found");
    }

    if (exercise.userId !== user.id) {
      throw new ActionError("You can only view your own exercise history");
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId,
        completedAt: { gte: since },
      },
      orderBy: { completedAt: "desc" },
    });

    return logs;
  });

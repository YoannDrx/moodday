"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMoodEntrySchema = z.object({
  value: z.number().min(0).max(10),
  note: z.string().optional(),
});

const updateMoodEntrySchema = z.object({
  id: z.string(),
  value: z.number().min(0).max(10),
  note: z.string().optional(),
});

const deleteMoodEntrySchema = z.object({
  id: z.string(),
});

const getMoodEntriesSchema = z.object({
  days: z.number().optional(), // Filter by last N days
  limit: z.number().optional().default(50),
  cursor: z.string().optional(), // For pagination
});

export const createMoodEntry = authAction
  .inputSchema(createMoodEntrySchema)
  .action(async ({ parsedInput: { value, note }, ctx: { user } }) => {
    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId: user.id,
        value,
        note: note ?? null,
        syncStatus: "synced",
      },
    });

    return moodEntry;
  });

export const updateMoodEntry = authAction
  .inputSchema(updateMoodEntrySchema)
  .action(async ({ parsedInput: { id, value, note }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.moodEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Mood entry not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only edit your own mood entries");
    }

    const moodEntry = await prisma.moodEntry.update({
      where: { id },
      data: {
        value,
        note: note ?? null,
      },
    });

    return moodEntry;
  });

export const deleteMoodEntry = authAction
  .inputSchema(deleteMoodEntrySchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.moodEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Mood entry not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only delete your own mood entries");
    }

    await prisma.moodEntry.delete({
      where: { id },
    });

    return { success: true };
  });

export const getMoodEntries = authAction
  .inputSchema(getMoodEntriesSchema)
  .action(async ({ parsedInput: { days, limit, cursor }, ctx: { user } }) => {
    const where: { userId: string; createdAt?: { gte: Date } } = {
      userId: user.id,
    };

    // Filter by date range
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      where.createdAt = { gte: startDate };
    }

    const entries = await prisma.moodEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Take one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = entries.length > limit;
    const data = hasMore ? entries.slice(0, -1) : entries;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      entries: data,
      nextCursor,
      hasMore,
    };
  });

// ===== Get Today's Mood Entry =====

export const getTodayMoodEntry = authAction.action(
  async ({ ctx: { user } }) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const entry = await prisma.moodEntry.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: startOfDay },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        value: true,
        createdAt: true,
      },
    });

    if (!entry) {
      throw new ActionError("No mood entry for today");
    }

    return {
      id: entry.id,
      value: entry.value,
      createdAt: entry.createdAt.toISOString(),
    };
  },
);

// ===== Save Mood Entry (Create or Update Today's) =====

const saveMoodEntrySchema = z.object({
  value: z.number().min(0).max(10),
  note: z.string().optional(),
});

export const saveMoodEntry = authAction
  .inputSchema(saveMoodEntrySchema)
  .action(async ({ parsedInput: { value, note }, ctx: { user } }) => {
    // Create a new entry (user can have multiple entries per day)
    const entry = await prisma.moodEntry.create({
      data: {
        userId: user.id,
        value,
        note: note ?? null,
        syncStatus: "synced",
      },
      select: {
        id: true,
        value: true,
        createdAt: true,
      },
    });

    return {
      id: entry.id,
      value: entry.value,
      createdAt: entry.createdAt.toISOString(),
    };
  });

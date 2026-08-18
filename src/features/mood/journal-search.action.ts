"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import {
  addCivilDays,
  civilMidnightToUtc,
  getCivilDateRangeDayCount,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { z } from "zod";

const tagSchema = z.string().trim().min(1).max(40);

export const saveMoodTagDefinition = authAction
  .inputSchema(
    z.object({
      displayLabel: tagSchema,
      category: z.enum(["context", "trigger", "protective"]),
      color: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .nullable()
        .optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const normalizedLabel = parsedInput.displayLabel
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase("fr-FR");
    return prisma.moodTagDefinition.upsert({
      where: {
        userId_normalizedLabel_category: {
          userId: user.id,
          normalizedLabel,
          category: parsedInput.category,
        },
      },
      create: {
        userId: user.id,
        normalizedLabel,
        displayLabel: parsedInput.displayLabel,
        category: parsedInput.category,
        color: parsedInput.color ?? null,
      },
      update: {
        displayLabel: parsedInput.displayLabel,
        color: parsedInput.color ?? null,
        isArchived: false,
      },
    });
  });

export const searchJournal = authAction
  .inputSchema(
    z.object({
      query: z.string().trim().max(100).default(""),
      tags: z.array(tagSchema).max(20).default([]),
      moodMin: z.number().int().min(0).max(10).optional(),
      moodMax: z.number().int().min(0).max(10).optional(),
      start: z.string().date().optional(),
      end: z.string().date().optional(),
      page: z.number().int().min(1).max(10_000).default(1),
      pageSize: z.number().int().min(1).max(100).default(30),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (parsedInput.start && parsedInput.end) {
      const days = getCivilDateRangeDayCount(
        parsedInput.start,
        parsedInput.end,
      );
      if (days < 1 || days > 365) {
        throw new ActionError("The journal date range must be 1 to 365 days");
      }
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const timezone = getSafeTimeZone(preferences?.timezone);
    const entries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        ...(parsedInput.query
          ? { note: { contains: parsedInput.query, mode: "insensitive" } }
          : {}),
        ...(parsedInput.tags.length > 0
          ? { tags: { hasEvery: parsedInput.tags } }
          : {}),
        value: {
          gte: parsedInput.moodMin,
          lte: parsedInput.moodMax,
        },
        createdAt: {
          gte: parsedInput.start
            ? civilMidnightToUtc(parsedInput.start, timezone)
            : undefined,
          lt: parsedInput.end
            ? civilMidnightToUtc(addCivilDays(parsedInput.end, 1), timezone)
            : undefined,
        },
      },
      select: {
        id: true,
        value: true,
        energy: true,
        anxiety: true,
        tags: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (parsedInput.page - 1) * parsedInput.pageSize,
      take: parsedInput.pageSize,
    });
    return { entries, timezone };
  });

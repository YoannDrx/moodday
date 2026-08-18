"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import {
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { normalizeTherapyCivilDate } from "./therapy-date";
import { z } from "zod";

// ===== Therapy Session Actions =====

const therapyDateSchema = z.union([
  z.string().date(),
  z.string().datetime(),
  z.date(),
]);

const createSessionSchema = z.object({
  operationId: z.string().min(1).max(80).optional(),
  date: therapyDateSchema,
  notes: z.string().min(1, "Les notes sont requises").max(5_000),
  benefitRating: z.number().min(1).max(5).optional(),
});

const updateSessionSchema = z.object({
  id: z.string(),
  date: therapyDateSchema,
  notes: z.string().min(1, "Les notes sont requises").max(5_000),
  benefitRating: z.number().min(1).max(5).optional().nullable(),
});

const getSessionsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).max(1_000_000).optional().default(0),
});

const getTherapyDateForUser = async (userId: string, input: string | Date) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const timezone = getSafeTimeZone(preferences?.timezone);
  const normalized = normalizeTherapyCivilDate(input, timezone);
  if (normalized.dateKey > getDateKeyForTimeZone(new Date(), timezone)) {
    throw new ActionError("The therapy date cannot be in the future");
  }
  return normalized.date;
};

export const createTherapySession = authAction
  .inputSchema(createSessionSchema)
  .action(
    async ({
      parsedInput: { operationId, date, notes, benefitRating },
      ctx: { user },
    }) => {
      const therapyDate = await getTherapyDateForUser(user.id, date);
      const data = {
        userId: user.id,
        clientOperationId: operationId ?? null,
        date: therapyDate,
        notes,
        benefitRating,
        syncStatus: "synced",
      };

      const session = operationId
        ? await prisma.therapySession.upsert({
            where: {
              userId_clientOperationId: {
                userId: user.id,
                clientOperationId: operationId,
              },
            },
            create: data,
            update: {},
          })
        : await prisma.therapySession.create({ data });

      return session;
    },
  );

export const updateTherapySession = authAction
  .inputSchema(updateSessionSchema)
  .action(
    async ({
      parsedInput: { id, date, notes, benefitRating },
      ctx: { user },
    }) => {
      // Verify ownership
      const existing = await prisma.therapySession.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existing) {
        throw new ActionError("Session not found");
      }

      if (existing.userId !== user.id) {
        throw new ActionError("You can only edit your own sessions");
      }

      const therapyDate = await getTherapyDateForUser(user.id, date);

      const session = await prisma.therapySession.update({
        where: { id },
        data: {
          date: therapyDate,
          notes,
          benefitRating,
        },
      });

      return session;
    },
  );

export const deleteTherapySession = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.therapySession.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Session not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only delete your own sessions");
    }

    await prisma.therapySession.delete({
      where: { id },
    });

    return { success: true };
  });

export const getTherapySessions = authAction
  .inputSchema(getSessionsSchema)
  .action(async ({ parsedInput: { limit, offset }, ctx: { user } }) => {
    const [sessions, total, preferences] = await Promise.all([
      prisma.therapySession.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.therapySession.count({
        where: { userId: user.id },
      }),
      prisma.userPreferences.findUnique({
        where: { userId: user.id },
        select: { timezone: true },
      }),
    ]);

    return {
      sessions,
      total,
      timezone: getSafeTimeZone(preferences?.timezone),
    };
  });

export const getTherapySessionById = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const session = await prisma.therapySession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new ActionError("Session not found");
    }

    if (session.userId !== user.id) {
      throw new ActionError("You can only view your own sessions");
    }

    return session;
  });

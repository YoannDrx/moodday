"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ===== Therapy Session Actions =====

const createSessionSchema = z.object({
  operationId: z.string().min(1).max(80).optional(),
  date: z.string().or(z.date()),
  notes: z.string().min(1, "Les notes sont requises"),
  benefitRating: z.number().min(1).max(5).optional(),
});

const updateSessionSchema = z.object({
  id: z.string(),
  date: z.string().or(z.date()),
  notes: z.string().min(1, "Les notes sont requises"),
  benefitRating: z.number().min(1).max(5).optional().nullable(),
});

const getSessionsSchema = z.object({
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

export const createTherapySession = authAction
  .inputSchema(createSessionSchema)
  .action(
    async ({
      parsedInput: { operationId, date, notes, benefitRating },
      ctx: { user },
    }) => {
      const data = {
        userId: user.id,
        clientOperationId: operationId ?? null,
        date: new Date(date),
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

      const session = await prisma.therapySession.update({
        where: { id },
        data: {
          date: new Date(date),
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
    const sessions = await prisma.therapySession.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.therapySession.count({
      where: { userId: user.id },
    });

    return { sessions, total };
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

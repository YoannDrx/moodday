"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import {
  civilMidnightToUtc,
  getCivilDateRangeDayCount,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const dateKey = z.string().date();
const preparationSchema = z
  .object({
    id: z.string().optional(),
    scheduledFor: z.string().date().nullable().optional(),
    title: z.string().trim().min(1).max(200),
    questions: z.array(z.string().trim().min(1).max(500)).max(20),
    importantEvents: z.array(z.string().trim().min(1).max(500)).max(20),
    periodStartDate: dateKey,
    periodEndDate: dateKey,
    personalNotes: z.string().max(5_000).nullable().optional(),
    status: z.enum(["draft", "completed", "archived"]).default("draft"),
  })
  .refine((value) => value.periodStartDate <= value.periodEndDate)
  .refine(
    (value) =>
      getCivilDateRangeDayCount(value.periodStartDate, value.periodEndDate) <=
      365,
  );

export const listConsultationPreparations = authAction
  .inputSchema(
    z.object({ page: z.number().int().min(1).max(10_000).default(1) }),
  )
  .action(async ({ parsedInput: { page }, ctx: { user } }) =>
    prisma.consultationPreparation.findMany({
      where: { userId: user.id, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    }),
  );

export const saveConsultationPreparation = authAction
  .inputSchema(preparationSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const timezone = getSafeTimeZone(preferences?.timezone);
    const data = {
      scheduledFor: parsedInput.scheduledFor
        ? civilMidnightToUtc(parsedInput.scheduledFor, timezone)
        : null,
      title: parsedInput.title,
      questions: parsedInput.questions,
      importantEvents: parsedInput.importantEvents,
      periodStartDate: parsedInput.periodStartDate,
      periodEndDate: parsedInput.periodEndDate,
      personalNotes: parsedInput.personalNotes ?? null,
      status: parsedInput.status,
    };
    if (!parsedInput.id) {
      const created = await prisma.consultationPreparation.create({
        data: { ...data, userId: user.id },
      });
      revalidatePath("/consultation");
      return created;
    }
    const result = await prisma.consultationPreparation.updateMany({
      where: { id: parsedInput.id, userId: user.id },
      data,
    });
    if (result.count !== 1) throw new ActionError("Preparation not found");
    const updated = await prisma.consultationPreparation.findUniqueOrThrow({
      where: { id: parsedInput.id },
    });
    revalidatePath("/consultation");
    return updated;
  });

export const setConsultationPreparationStatus = authAction
  .inputSchema(
    z.object({
      id: z.string(),
      status: z.enum(["draft", "completed", "archived"]),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const result = await prisma.consultationPreparation.updateMany({
      where: { id: parsedInput.id, userId: user.id },
      data: { status: parsedInput.status },
    });
    if (result.count !== 1) throw new ActionError("Preparation not found");
    revalidatePath("/consultation");
    return { id: parsedInput.id, status: parsedInput.status };
  });

"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import {
  buildMedicationDoseSlots,
  createScheduledDoseKey,
  getDateKeyForTimeZone,
  hasOfflineDoseConflict,
  normalizeScheduleTimesForFrequency,
  normalizeWeeklyDay,
} from "@/features/medication/schedule";
import { z } from "zod";

const scheduleTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const createMedicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().optional().default(false),
  scheduleTimes: z.array(scheduleTimeSchema).max(2).optional().default([]),
  weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
});

const updateMedicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().optional().default(false),
  scheduleTimes: z.array(scheduleTimeSchema).max(2).optional().default([]),
  weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
});

const getMedicationsSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

export const createMedication = authAction
  .inputSchema(createMedicationSchema)
  .action(
    async ({
      parsedInput: { name, dosage, frequency, isPRN, scheduleTimes, weeklyDay },
      ctx: { user },
    }) => {
      const medication = await prisma.medication.create({
        data: {
          userId: user.id,
          name,
          dosage,
          frequency,
          isPRN: isPRN || frequency === "prn",
          scheduleTimes: normalizeScheduleTimesForFrequency(
            frequency,
            scheduleTimes,
          ),
          weeklyDay:
            frequency === "weekly" ? normalizeWeeklyDay(weeklyDay) : null,
          syncStatus: "synced",
        },
      });

      // Create initial history entry
      await prisma.medicationHistory.create({
        data: {
          medicationId: medication.id,
          dosage,
          reason: "Initial dosage",
        },
      });

      return medication;
    },
  );

export const updateMedication = authAction
  .inputSchema(updateMedicationSchema)
  .action(
    async ({
      parsedInput: {
        id,
        name,
        dosage,
        frequency,
        isPRN,
        scheduleTimes,
        weeklyDay,
      },
      ctx: { user },
    }) => {
      // Verify ownership
      const existing = await prisma.medication.findUnique({
        where: { id },
        select: { userId: true, dosage: true, createdAt: true },
      });

      if (!existing) {
        throw new ActionError("Medication not found");
      }

      if (existing.userId !== user.id) {
        throw new ActionError("You can only edit your own medications");
      }

      // Check if dosage changed
      const dosageChanged = existing.dosage !== dosage;

      const medication = await prisma.medication.update({
        where: { id },
        data: {
          name,
          dosage,
          frequency,
          isPRN: isPRN || frequency === "prn",
          scheduleTimes: normalizeScheduleTimesForFrequency(
            frequency,
            scheduleTimes,
          ),
          weeklyDay:
            frequency === "weekly"
              ? normalizeWeeklyDay(weeklyDay, existing.createdAt)
              : null,
        },
      });

      // Create history entry if dosage changed
      if (dosageChanged) {
        await prisma.medicationHistory.create({
          data: {
            medicationId: id,
            dosage,
            previousDosage: existing.dosage,
            reason: "Dosage adjustment",
          },
        });
      }

      return medication;
    },
  );

export const archiveMedication = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.medication.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Medication not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only archive your own medications");
    }

    const medication = await prisma.medication.update({
      where: { id },
      data: { isArchived: true },
    });

    return medication;
  });

export const unarchiveMedication = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    // Verify ownership
    const existing = await prisma.medication.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      throw new ActionError("Medication not found");
    }

    if (existing.userId !== user.id) {
      throw new ActionError("You can only unarchive your own medications");
    }

    const medication = await prisma.medication.update({
      where: { id },
      data: { isArchived: false },
    });

    return medication;
  });

export const getMedications = authAction
  .inputSchema(getMedicationsSchema)
  .action(async ({ parsedInput: { includeArchived }, ctx: { user } }) => {
    const dateKey = await getUserDateKey(user.id, new Date());
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        intakes: {
          where: {
            OR: [
              { scheduledForDate: dateKey },
              {
                scheduledForDate: null,
                takenAt: { gte: startOfDay },
              },
            ],
          },
          orderBy: { takenAt: "desc" },
        },
      },
      orderBy: [{ isPRN: "asc" }, { name: "asc" }],
    });

    return medications.map((medication) => ({
      ...medication,
      doseSlots:
        medication.isPRN || medication.isArchived
          ? []
          : buildMedicationDoseSlots(medication, dateKey),
    }));
  });

export const getMedicationById = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!medication) {
      throw new ActionError("Medication not found");
    }

    if (medication.userId !== user.id) {
      throw new ActionError("You can only view your own medications");
    }

    return medication;
  });

// ===== Medication Intake Actions =====

const scheduledForDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const logIntakeSchema = z.object({
  medicationId: z.string(),
  note: z.string().optional(),
  operationId: z.string().min(1).max(80).optional(),
  doseIndex: z.number().int().min(0).max(12).optional().default(0),
  scheduledForDate: scheduledForDateSchema.optional(),
  takenAt: z.string().datetime().optional(),
});

const skipIntakeSchema = z.object({
  medicationId: z.string(),
  reason: z.string().optional(),
  operationId: z.string().min(1).max(80).optional(),
  doseIndex: z.number().int().min(0).max(12).optional().default(0),
  scheduledForDate: scheduledForDateSchema.optional(),
  takenAt: z.string().datetime().optional(),
});

const deleteIntakeSchema = z.object({
  intakeId: z.string(),
});

const getUserDateKey = async (userId: string, date: Date) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { timezone: true },
  });

  return getDateKeyForTimeZone(date, preferences?.timezone);
};

export const logMedIntake = authAction
  .inputSchema(logIntakeSchema)
  .action(
    async ({
      parsedInput: {
        medicationId,
        note,
        operationId,
        doseIndex,
        scheduledForDate,
        takenAt,
      },
      ctx: { user },
    }) => {
      // Verify medication ownership
      const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
        select: { userId: true, isPRN: true },
      });

      if (!medication) {
        throw new ActionError("Medication not found");
      }

      if (medication.userId !== user.id) {
        throw new ActionError(
          "You can only log intake for your own medications",
        );
      }

      if (medication.isPRN) {
        throw new ActionError("Use PRN intake for as-needed medications");
      }

      const takenAtDate = takenAt ? new Date(takenAt) : new Date();
      const dateKey =
        scheduledForDate ?? (await getUserDateKey(user.id, takenAtDate));
      const doseKey = createScheduledDoseKey(medicationId, dateKey, doseIndex);

      if (operationId) {
        const existingIntake = await prisma.medIntake.findUnique({
          where: { doseKey },
          select: { clientOperationId: true },
        });
        if (
          existingIntake &&
          hasOfflineDoseConflict(existingIntake.clientOperationId, operationId)
        ) {
          throw new ActionError(
            "This scheduled dose changed after the offline action was saved",
          );
        }
      }

      const intake = await prisma.medIntake.upsert({
        where: { doseKey },
        create: {
          medicationId,
          takenAt: takenAtDate,
          skipped: false,
          note: note ?? null,
          scheduledForDate: dateKey,
          doseIndex,
          doseKey,
          clientOperationId: operationId ?? null,
        },
        update: {
          takenAt: takenAtDate,
          skipped: false,
          note: note ?? null,
          scheduledForDate: dateKey,
          doseIndex,
          clientOperationId: operationId ?? null,
        },
      });

      return intake;
    },
  );

export const skipMedIntake = authAction
  .inputSchema(skipIntakeSchema)
  .action(
    async ({
      parsedInput: {
        medicationId,
        reason,
        operationId,
        doseIndex,
        scheduledForDate,
        takenAt,
      },
      ctx: { user },
    }) => {
      // Verify medication ownership
      const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
        select: { userId: true, isPRN: true },
      });

      if (!medication) {
        throw new ActionError("Medication not found");
      }

      if (medication.userId !== user.id) {
        throw new ActionError("You can only skip your own medications");
      }

      if (medication.isPRN) {
        throw new ActionError("Use PRN intake for as-needed medications");
      }

      const takenAtDate = takenAt ? new Date(takenAt) : new Date();
      const dateKey =
        scheduledForDate ?? (await getUserDateKey(user.id, takenAtDate));
      const doseKey = createScheduledDoseKey(medicationId, dateKey, doseIndex);

      if (operationId) {
        const existingIntake = await prisma.medIntake.findUnique({
          where: { doseKey },
          select: { clientOperationId: true },
        });
        if (
          existingIntake &&
          hasOfflineDoseConflict(existingIntake.clientOperationId, operationId)
        ) {
          throw new ActionError(
            "This scheduled dose changed after the offline action was saved",
          );
        }
      }

      const intake = await prisma.medIntake.upsert({
        where: { doseKey },
        create: {
          medicationId,
          takenAt: takenAtDate,
          skipped: true,
          note: reason ?? null,
          scheduledForDate: dateKey,
          doseIndex,
          doseKey,
          clientOperationId: operationId ?? null,
        },
        update: {
          takenAt: takenAtDate,
          skipped: true,
          note: reason ?? null,
          scheduledForDate: dateKey,
          doseIndex,
          clientOperationId: operationId ?? null,
        },
      });

      return intake;
    },
  );

export const deleteMedIntake = authAction
  .inputSchema(deleteIntakeSchema)
  .action(async ({ parsedInput: { intakeId }, ctx: { user } }) => {
    // Verify ownership through medication
    const intake = await prisma.medIntake.findUnique({
      where: { id: intakeId },
      include: {
        medication: {
          select: { userId: true },
        },
      },
    });

    if (!intake) {
      throw new ActionError("Intake not found");
    }

    if (intake.medication.userId !== user.id) {
      throw new ActionError("You can only delete your own intake records");
    }

    await prisma.medIntake.delete({
      where: { id: intakeId },
    });

    return { success: true };
  });

export const getTodayIntakes = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const dateKey = await getUserDateKey(user.id, new Date());
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        isPRN: false,
      },
      include: {
        intakes: {
          where: {
            OR: [
              { scheduledForDate: dateKey },
              {
                scheduledForDate: null,
                takenAt: { gte: startOfDay },
              },
            ],
          },
          orderBy: { takenAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return medications
      .map((medication) => ({
        ...medication,
        doseSlots: buildMedicationDoseSlots(medication, dateKey),
      }))
      .filter((medication) => medication.doseSlots.length > 0);
  });

export const getPRNMedications = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        isPRN: true,
      },
      include: {
        intakes: {
          where: {
            takenAt: { gte: startOfDay },
          },
          orderBy: { takenAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return medications;
  });

const logPRNIntakeSchema = z.object({
  medicationId: z.string(),
  reason: z.string().optional(),
  operationId: z.string().min(1).max(80).optional(),
  takenAt: z.string().datetime().optional(),
});

export const logPRNIntake = authAction
  .inputSchema(logPRNIntakeSchema)
  .action(
    async ({
      parsedInput: { medicationId, reason, operationId, takenAt },
      ctx: { user },
    }) => {
      // Verify medication ownership and PRN status
      const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
        select: { userId: true, isPRN: true },
      });

      if (!medication) {
        throw new ActionError("Medication not found");
      }

      if (medication.userId !== user.id) {
        throw new ActionError(
          "You can only log intake for your own medications",
        );
      }

      if (!medication.isPRN) {
        throw new ActionError("This medication is not marked as PRN");
      }

      const data = {
        medicationId,
        clientOperationId: operationId ?? null,
        takenAt: takenAt ? new Date(takenAt) : new Date(),
        skipped: false,
        note: reason,
      };

      const intake = operationId
        ? await prisma.medIntake.upsert({
            where: {
              medicationId_clientOperationId: {
                medicationId,
                clientOperationId: operationId,
              },
            },
            create: data,
            update: {},
          })
        : await prisma.medIntake.create({ data });

      return intake;
    },
  );

export const getPRNHistory = authAction
  .inputSchema(z.object({ medicationId: z.string() }))
  .action(async ({ parsedInput: { medicationId }, ctx: { user } }) => {
    // Verify medication ownership
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      select: { userId: true },
    });

    if (!medication) {
      throw new ActionError("Medication not found");
    }

    if (medication.userId !== user.id) {
      throw new ActionError("You can only view your own medication history");
    }

    const intakes = await prisma.medIntake.findMany({
      where: {
        medicationId,
        skipped: false,
      },
      orderBy: { takenAt: "desc" },
      take: 30, // Last 30 intakes
    });

    return intakes;
  });

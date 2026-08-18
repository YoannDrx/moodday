"use server";

import type { Prisma } from "@prisma/client";
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
import { getExportDateRange } from "@/features/export/date-range";
import {
  getMedicationForOperation,
  recordMedicationOperation,
} from "@/features/medication/mutation-idempotency";

const scheduleTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const civilDateSchema = z.string().date();
const stockValueSchema = z.number().nonnegative().max(1_000_000);
const unitsPerDoseSchema = z.number().positive().max(1_000_000);

const lockMedicationMutation = async (
  transaction: Prisma.TransactionClient,
  medicationId: string,
) => {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`medication:${medicationId}`}, 0))
  `;
};

const operationIdSchema = z.string().min(1).max(80);

const createMedicationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(200),
  dosage: z.string().trim().min(1, "Le dosage est requis").max(200),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().optional().default(false),
  scheduleTimes: z.array(scheduleTimeSchema).max(2).optional().default([]),
  weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
  startDate: civilDateSchema.optional(),
  endDate: civilDateSchema.nullable().optional(),
  stockQuantity: stockValueSchema.nullable().optional(),
  unitsPerDose: unitsPerDoseSchema.nullable().optional(),
  lowStockThreshold: stockValueSchema.nullable().optional(),
  operationId: operationIdSchema.optional(),
});

const updateMedicationSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Le nom est requis").max(200),
  dosage: z.string().trim().min(1, "Le dosage est requis").max(200),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().optional().default(false),
  scheduleTimes: z.array(scheduleTimeSchema).max(2).optional().default([]),
  weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
  startDate: civilDateSchema.optional(),
  endDate: civilDateSchema.nullable().optional(),
  stockQuantity: stockValueSchema.nullable().optional(),
  unitsPerDose: unitsPerDoseSchema.nullable().optional(),
  lowStockThreshold: stockValueSchema.nullable().optional(),
  reason: z.string().trim().max(500).optional(),
  operationId: operationIdSchema.optional(),
});

const getMedicationsSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

export const createMedication = authAction
  .inputSchema(createMedicationSchema)
  .action(
    async ({
      parsedInput: {
        name,
        dosage,
        frequency,
        isPRN,
        scheduleTimes,
        weeklyDay,
        startDate,
        endDate,
        stockQuantity,
        unitsPerDose,
        lowStockThreshold,
        operationId,
      },
      ctx: { user },
    }) => {
      const effectiveDate =
        startDate ?? (await getUserDateKey(user.id, new Date()));
      if (endDate && endDate < effectiveDate) {
        throw new ActionError("Treatment end date must follow its start date");
      }
      const normalizedSchedule = normalizeScheduleTimesForFrequency(
        frequency,
        scheduleTimes,
      );
      const normalizedWeeklyDay =
        frequency === "weekly" ? normalizeWeeklyDay(weeklyDay) : null;

      return prisma.$transaction(async (transaction) => {
        const priorResult = await getMedicationForOperation(transaction, {
          userId: user.id,
          operationId,
          mutationType: "create",
        });
        if (priorResult) return priorResult;

        const medication = await transaction.medication.create({
          data: {
            userId: user.id,
            name,
            dosage,
            frequency,
            isPRN: isPRN || frequency === "prn",
            scheduleTimes: normalizedSchedule,
            weeklyDay: normalizedWeeklyDay,
            startDate: effectiveDate,
            endDate: endDate ?? null,
            stockQuantity: stockQuantity ?? null,
            unitsPerDose: unitsPerDose ?? null,
            lowStockThreshold: lowStockThreshold ?? null,
            syncStatus: "synced",
          },
        });

        await Promise.all([
          transaction.medicationHistory.create({
            data: {
              medicationId: medication.id,
              dosage,
              reason: "Initial dosage",
            },
          }),
          transaction.medicationScheduleRevision.create({
            data: {
              medicationId: medication.id,
              effectiveDate,
              dosage,
              frequency,
              scheduleTimes: normalizedSchedule,
              weeklyDay: normalizedWeeklyDay,
              unitsPerDose: unitsPerDose ?? null,
              reason: "Initial schedule",
              authoredById: user.id,
            },
          }),
        ]);

        if (stockQuantity !== undefined && stockQuantity !== null) {
          await transaction.medicationInventoryEvent.create({
            data: {
              medicationId: medication.id,
              quantityDelta: stockQuantity,
              reason: "manual",
            },
          });
        }

        await recordMedicationOperation(transaction, {
          userId: user.id,
          operationId,
          medicationId: medication.id,
          mutationType: "create",
        });

        return medication;
      });
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
        startDate,
        endDate,
        stockQuantity,
        unitsPerDose,
        lowStockThreshold,
        reason,
        operationId,
      },
      ctx: { user },
    }) => {
      const normalizedSchedule = normalizeScheduleTimesForFrequency(
        frequency,
        scheduleTimes,
      );
      const effectiveDate = await getUserDateKey(user.id, new Date());

      return prisma.$transaction(async (transaction) => {
        const priorResult = await getMedicationForOperation(transaction, {
          userId: user.id,
          operationId,
          mutationType: "update",
          medicationId: id,
        });
        if (priorResult) return priorResult;

        await lockMedicationMutation(transaction, id);
        const existing = await transaction.medication.findUnique({
          where: { id },
          select: {
            userId: true,
            dosage: true,
            frequency: true,
            scheduleTimes: true,
            weeklyDay: true,
            unitsPerDose: true,
            stockQuantity: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
        });

        if (!existing) {
          throw new ActionError("Medication not found");
        }
        if (existing.userId !== user.id) {
          throw new ActionError("You can only edit your own medications");
        }

        const dosageChanged = existing.dosage !== dosage;
        const normalizedWeeklyDay =
          frequency === "weekly"
            ? normalizeWeeklyDay(weeklyDay, existing.createdAt)
            : null;
        const nextStartDate = startDate ?? existing.startDate ?? effectiveDate;
        const nextEndDate = endDate === undefined ? existing.endDate : endDate;
        const nextUnitsPerDose =
          unitsPerDose === undefined ? existing.unitsPerDose : unitsPerDose;
        if (nextEndDate && nextEndDate < nextStartDate) {
          throw new ActionError(
            "Treatment end date must follow its start date",
          );
        }
        const scheduleChanged =
          dosageChanged ||
          existing.frequency !== frequency ||
          existing.weeklyDay !== normalizedWeeklyDay ||
          existing.unitsPerDose?.toString() !== nextUnitsPerDose?.toString() ||
          JSON.stringify(existing.scheduleTimes) !==
            JSON.stringify(normalizedSchedule);

        const medication = await transaction.medication.update({
          where: { id },
          data: {
            name,
            dosage,
            frequency,
            isPRN: isPRN || frequency === "prn",
            scheduleTimes: normalizedSchedule,
            weeklyDay: normalizedWeeklyDay,
            startDate: nextStartDate,
            endDate: nextEndDate,
            stockQuantity:
              stockQuantity === undefined
                ? existing.stockQuantity
                : stockQuantity,
            unitsPerDose: nextUnitsPerDose,
            lowStockThreshold,
          },
        });

        if (dosageChanged) {
          await transaction.medicationHistory.create({
            data: {
              medicationId: id,
              dosage,
              previousDosage: existing.dosage,
              reason: reason ?? "Dosage adjustment",
            },
          });
        }
        if (scheduleChanged) {
          await transaction.medicationScheduleRevision.create({
            data: {
              medicationId: id,
              effectiveDate,
              dosage,
              frequency,
              scheduleTimes: normalizedSchedule,
              weeklyDay: normalizedWeeklyDay,
              unitsPerDose: nextUnitsPerDose,
              reason: reason ?? "Schedule adjustment",
              authoredById: user.id,
            },
          });
        }
        if (stockQuantity !== undefined) {
          const currentStock = Number(existing.stockQuantity ?? 0);
          const nextStock = stockQuantity ?? 0;
          const quantityDelta = nextStock - currentStock;
          if (quantityDelta !== 0) {
            await transaction.medicationInventoryEvent.create({
              data: {
                medicationId: id,
                quantityDelta,
                reason: "correction",
              },
            });
          }
        }
        await recordMedicationOperation(transaction, {
          userId: user.id,
          operationId,
          medicationId: id,
          mutationType: "update",
        });
        return medication;
      });
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

const adjustMedicationStockSchema = z
  .object({
    medicationId: z.string(),
    quantityDelta: z
      .number()
      .min(-1_000_000)
      .max(1_000_000)
      .refine((value) => value !== 0),
    reason: z.enum(["refill", "correction", "manual"]),
    operationId: operationIdSchema.optional(),
  })
  .superRefine(({ quantityDelta, reason }, context) => {
    if (reason === "refill" && quantityDelta <= 0) {
      context.addIssue({
        code: "custom",
        path: ["quantityDelta"],
        message: "A refill must increase the stock quantity",
      });
    }
  });

export const adjustMedicationStock = authAction
  .inputSchema(adjustMedicationStockSchema)
  .action(
    async ({
      parsedInput: { medicationId, quantityDelta, reason, operationId },
      ctx: { user },
    }) =>
      prisma.$transaction(async (transaction) => {
        const priorResult = await getMedicationForOperation(transaction, {
          userId: user.id,
          operationId,
          mutationType: "stock_adjustment",
          medicationId,
        });
        if (priorResult) return priorResult;

        await lockMedicationMutation(transaction, medicationId);
        const medication = await transaction.medication.findUnique({
          where: { id: medicationId },
          select: { userId: true, stockQuantity: true },
        });
        if (!medication) throw new ActionError("Medication not found");
        if (medication.userId !== user.id) {
          throw new ActionError(
            "You can only update your own medication stock",
          );
        }
        const nextQuantity =
          Number(medication.stockQuantity ?? 0) + quantityDelta;
        if (nextQuantity < 0) {
          throw new ActionError("Stock quantity cannot be negative");
        }
        const updated = await transaction.medication.update({
          where: { id: medicationId },
          data: { stockQuantity: nextQuantity },
        });
        await transaction.medicationInventoryEvent.create({
          data: { medicationId, quantityDelta, reason },
        });
        await recordMedicationOperation(transaction, {
          userId: user.id,
          operationId,
          medicationId,
          mutationType: "stock_adjustment",
        });
        return updated;
      }),
  );

export const getMedications = authAction
  .inputSchema(getMedicationsSchema)
  .action(async ({ parsedInput: { includeArchived }, ctx: { user } }) => {
    const { dateKey, start, endExclusive } = await getUserDayContext(
      user.id,
      new Date(),
    );

    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        ...(includeArchived
          ? {}
          : {
              isArchived: false,
              AND: [
                { OR: [{ startDate: null }, { startDate: { lte: dateKey } }] },
                { OR: [{ endDate: null }, { endDate: { gte: dateKey } }] },
              ],
            }),
      },
      include: {
        intakes: {
          where: {
            OR: [
              { scheduledForDate: dateKey },
              {
                scheduledForDate: null,
                takenAt: { gte: start, lt: endExclusive },
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
        scheduleRevisions: {
          orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
          take: 50,
        },
        inventoryEvents: {
          orderBy: { occurredAt: "desc" },
          take: 100,
        },
        intakeRevisions: {
          orderBy: { createdAt: "desc" },
          take: 100,
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

const scheduledForDateSchema = z.string().date();

const logIntakeSchema = z.object({
  medicationId: z.string(),
  note: z.string().max(5_000).optional(),
  operationId: z.string().min(1).max(80).optional(),
  doseIndex: z.number().int().min(0).max(12).optional().default(0),
  scheduledForDate: scheduledForDateSchema.optional(),
  takenAt: z.string().datetime().optional(),
});

const skipIntakeSchema = z.object({
  medicationId: z.string(),
  reason: z.string().max(2_000).optional(),
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

const getUserDayContext = async (userId: string, date: Date) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const timezone = preferences?.timezone ?? "Europe/Paris";
  const dateKey = getDateKeyForTimeZone(date, timezone);
  return {
    dateKey,
    ...getExportDateRange({ startDate: dateKey, endDate: dateKey, timezone }),
  };
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
        select: {
          userId: true,
          isPRN: true,
          unitsPerDose: true,
          stockQuantity: true,
        },
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

      return prisma.$transaction(async (transaction) => {
        await lockMedicationMutation(transaction, medicationId);
        const inventory = await transaction.medication.findUniqueOrThrow({
          where: { id: medicationId },
          select: { unitsPerDose: true, stockQuantity: true },
        });
        const previous = await transaction.medIntake.findUnique({
          where: { doseKey },
        });
        if (
          operationId &&
          previous &&
          hasOfflineDoseConflict(previous.clientOperationId, operationId)
        ) {
          throw new ActionError(
            "This scheduled dose changed after the offline action was saved",
          );
        }
        if (operationId && previous?.clientOperationId === operationId) {
          return previous;
        }
        const intake = await transaction.medIntake.upsert({
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

        if (previous) {
          await transaction.medicationIntakeRevision.create({
            data: {
              medIntakeId: previous.id,
              medicationId,
              actorId: user.id,
              action: "corrected",
              previousSkipped: previous.skipped,
              nextSkipped: false,
              previousTakenAt: previous.takenAt,
              nextTakenAt: takenAtDate,
              previousDoseIndex: previous.doseIndex,
              nextDoseIndex: doseIndex,
              previousDateKey: previous.scheduledForDate,
              nextDateKey: dateKey,
            },
          });
        }

        if (
          (previous === null || previous.skipped) &&
          inventory.unitsPerDose !== null &&
          inventory.stockQuantity !== null &&
          Number(inventory.stockQuantity) >= Number(inventory.unitsPerDose)
        ) {
          await Promise.all([
            transaction.medication.update({
              where: { id: medicationId },
              data: {
                stockQuantity: { decrement: inventory.unitsPerDose },
              },
            }),
            transaction.medicationInventoryEvent.create({
              data: {
                medicationId,
                medIntakeId: intake.id,
                quantityDelta: -Number(inventory.unitsPerDose),
                reason: "intake",
              },
            }),
          ]);
        }
        return intake;
      });
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
        select: {
          userId: true,
          isPRN: true,
          unitsPerDose: true,
          stockQuantity: true,
        },
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

      return prisma.$transaction(async (transaction) => {
        await lockMedicationMutation(transaction, medicationId);
        const inventory = await transaction.medication.findUniqueOrThrow({
          where: { id: medicationId },
          select: { unitsPerDose: true, stockQuantity: true },
        });
        const previous = await transaction.medIntake.findUnique({
          where: { doseKey },
        });
        if (
          operationId &&
          previous &&
          hasOfflineDoseConflict(previous.clientOperationId, operationId)
        ) {
          throw new ActionError(
            "This scheduled dose changed after the offline action was saved",
          );
        }
        if (operationId && previous?.clientOperationId === operationId) {
          return previous;
        }
        const intake = await transaction.medIntake.upsert({
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
        if (previous) {
          await transaction.medicationIntakeRevision.create({
            data: {
              medIntakeId: previous.id,
              medicationId,
              actorId: user.id,
              action: "corrected",
              previousSkipped: previous.skipped,
              nextSkipped: true,
              previousTakenAt: previous.takenAt,
              nextTakenAt: takenAtDate,
              previousDoseIndex: previous.doseIndex,
              nextDoseIndex: doseIndex,
              previousDateKey: previous.scheduledForDate,
              nextDateKey: dateKey,
            },
          });
        }
        if (
          previous?.skipped === false &&
          inventory.unitsPerDose !== null &&
          inventory.stockQuantity !== null
        ) {
          await Promise.all([
            transaction.medication.update({
              where: { id: medicationId },
              data: {
                stockQuantity: { increment: inventory.unitsPerDose },
              },
            }),
            transaction.medicationInventoryEvent.create({
              data: {
                medicationId,
                medIntakeId: intake.id,
                quantityDelta: inventory.unitsPerDose,
                reason: "correction",
              },
            }),
          ]);
        }
        return intake;
      });
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
          select: {
            userId: true,
            unitsPerDose: true,
            stockQuantity: true,
          },
        },
      },
    });

    if (!intake) {
      throw new ActionError("Intake not found");
    }

    if (intake.medication.userId !== user.id) {
      throw new ActionError("You can only delete your own intake records");
    }

    await prisma.$transaction(async (transaction) => {
      await lockMedicationMutation(transaction, intake.medicationId);
      const current = await transaction.medIntake.findUniqueOrThrow({
        where: { id: intakeId },
        include: {
          medication: {
            select: { unitsPerDose: true, stockQuantity: true },
          },
        },
      });
      if (
        !current.skipped &&
        current.medication.unitsPerDose !== null &&
        current.medication.stockQuantity !== null
      ) {
        await Promise.all([
          transaction.medication.update({
            where: { id: current.medicationId },
            data: {
              stockQuantity: { increment: current.medication.unitsPerDose },
            },
          }),
          transaction.medicationInventoryEvent.create({
            data: {
              medicationId: current.medicationId,
              quantityDelta: current.medication.unitsPerDose,
              reason: "correction",
            },
          }),
        ]);
      }
      await transaction.medicationIntakeRevision.create({
        data: {
          medIntakeId: current.id,
          medicationId: current.medicationId,
          actorId: user.id,
          action: "cancelled",
          previousSkipped: current.skipped,
          previousTakenAt: current.takenAt,
          previousDoseIndex: current.doseIndex,
          previousDateKey: current.scheduledForDate,
        },
      });
      await transaction.medIntake.delete({ where: { id: intakeId } });
    });

    return { success: true };
  });

export const getTodayIntakes = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const { dateKey, start, endExclusive } = await getUserDayContext(
      user.id,
      new Date(),
    );

    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        isPRN: false,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: dateKey } }] },
          { OR: [{ endDate: null }, { endDate: { gte: dateKey } }] },
        ],
      },
      include: {
        intakes: {
          where: {
            OR: [
              { scheduledForDate: dateKey },
              {
                scheduledForDate: null,
                takenAt: { gte: start, lt: endExclusive },
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
    const { start, endExclusive } = await getUserDayContext(
      user.id,
      new Date(),
    );

    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        isPRN: true,
      },
      include: {
        intakes: {
          where: {
            takenAt: { gte: start, lt: endExclusive },
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
        select: {
          userId: true,
          isPRN: true,
          unitsPerDose: true,
          stockQuantity: true,
        },
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

      return prisma.$transaction(async (transaction) => {
        await lockMedicationMutation(transaction, medicationId);
        const inventory = await transaction.medication.findUniqueOrThrow({
          where: { id: medicationId },
          select: { unitsPerDose: true, stockQuantity: true },
        });
        const previous = operationId
          ? await transaction.medIntake.findUnique({
              where: {
                medicationId_clientOperationId: {
                  medicationId,
                  clientOperationId: operationId,
                },
              },
              select: { id: true },
            })
          : null;
        const intake = operationId
          ? await transaction.medIntake.upsert({
              where: {
                medicationId_clientOperationId: {
                  medicationId,
                  clientOperationId: operationId,
                },
              },
              create: data,
              update: {},
            })
          : await transaction.medIntake.create({ data });

        if (
          previous === null &&
          inventory.unitsPerDose !== null &&
          inventory.stockQuantity !== null &&
          Number(inventory.stockQuantity) >= Number(inventory.unitsPerDose)
        ) {
          await Promise.all([
            transaction.medication.update({
              where: { id: medicationId },
              data: {
                stockQuantity: { decrement: inventory.unitsPerDose },
              },
            }),
            transaction.medicationInventoryEvent.create({
              data: {
                medicationId,
                medIntakeId: intake.id,
                quantityDelta: -Number(inventory.unitsPerDose),
                reason: "intake",
              },
            }),
          ]);
        }
        return intake;
      });
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

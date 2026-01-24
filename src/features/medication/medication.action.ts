"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMedicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().optional().default(false),
});

const updateMedicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().optional().default(false),
});

const getMedicationsSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

export const createMedication = authAction
  .inputSchema(createMedicationSchema)
  .action(
    async ({
      parsedInput: { name, dosage, frequency, isPRN },
      ctx: { user },
    }) => {
      const medication = await prisma.medication.create({
        data: {
          userId: user.id,
          name,
          dosage,
          frequency,
          isPRN: isPRN || frequency === "prn",
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
      parsedInput: { id, name, dosage, frequency, isPRN },
      ctx: { user },
    }) => {
      // Verify ownership
      const existing = await prisma.medication.findUnique({
        where: { id },
        select: { userId: true, dosage: true },
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
    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        intakes: {
          where: {
            takenAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
            },
          },
          orderBy: { takenAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ isPRN: "asc" }, { name: "asc" }],
    });

    return medications;
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

const logIntakeSchema = z.object({
  medicationId: z.string(),
  note: z.string().optional(),
});

const skipIntakeSchema = z.object({
  medicationId: z.string(),
  reason: z.string().optional(),
});

const deleteIntakeSchema = z.object({
  intakeId: z.string(),
});

export const logMedIntake = authAction
  .inputSchema(logIntakeSchema)
  .action(async ({ parsedInput: { medicationId, note }, ctx: { user } }) => {
    // Verify medication ownership
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      select: { userId: true },
    });

    if (!medication) {
      throw new ActionError("Medication not found");
    }

    if (medication.userId !== user.id) {
      throw new ActionError("You can only log intake for your own medications");
    }

    const intake = await prisma.medIntake.create({
      data: {
        medicationId,
        takenAt: new Date(),
        skipped: false,
        note,
      },
    });

    return intake;
  });

export const skipMedIntake = authAction
  .inputSchema(skipIntakeSchema)
  .action(async ({ parsedInput: { medicationId, reason }, ctx: { user } }) => {
    // Verify medication ownership
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      select: { userId: true },
    });

    if (!medication) {
      throw new ActionError("Medication not found");
    }

    if (medication.userId !== user.id) {
      throw new ActionError("You can only skip your own medications");
    }

    const intake = await prisma.medIntake.create({
      data: {
        medicationId,
        takenAt: new Date(),
        skipped: true,
        note: reason,
      },
    });

    return intake;
  });

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
            takenAt: { gte: startOfDay },
          },
          orderBy: { takenAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return medications;
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
});

export const logPRNIntake = authAction
  .inputSchema(logPRNIntakeSchema)
  .action(async ({ parsedInput: { medicationId, reason }, ctx: { user } }) => {
    // Verify medication ownership and PRN status
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      select: { userId: true, isPRN: true },
    });

    if (!medication) {
      throw new ActionError("Medication not found");
    }

    if (medication.userId !== user.id) {
      throw new ActionError("You can only log intake for your own medications");
    }

    if (!medication.isPRN) {
      throw new ActionError("This medication is not marked as PRN");
    }

    const intake = await prisma.medIntake.create({
      data: {
        medicationId,
        takenAt: new Date(),
        skipped: false,
        note: reason,
      },
    });

    return intake;
  });

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

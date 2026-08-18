/* eslint-disable no-console -- standalone verification script emits one result */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { deleteUserAccountAtomically } from "@/lib/user/delete-user-data";
import {
  getMedicationForOperation,
  recordMedicationOperation,
} from "@/features/medication/mutation-idempotency";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const hostname = new URL(databaseUrl).hostname;
if (hostname !== "localhost" && hostname !== "127.0.0.1") {
  throw new Error(
    "Medication integrity verification requires a local database",
  );
}

const prisma = new PrismaClient();
const suffix = randomUUID();
const userId = `integrity-user-${suffix}`;
const medicationId = `integrity-medication-${suffix}`;
const userEmail = `${suffix}@integrity.moodday.invalid`;
const managedImage = `https://fixture.public.blob.vercel-storage.com/profile-images/${suffix}.png`;

const lockMedication = async (transaction: Prisma.TransactionClient) => {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`medication:${medicationId}`}, 0))
  `;
};

const main = async () => {
  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: "Integrity fixture",
        email: userEmail,
        emailVerified: true,
        image: managedImage,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.medication.create({
      data: {
        id: medicationId,
        userId,
        name: "Integrity fixture",
        dosage: "fixture",
        frequency: "daily",
        stockQuantity: 2,
        unitsPerDose: 1,
      },
    });

    await assert.rejects(
      prisma.$transaction(async (transaction) => {
        await lockMedication(transaction);
        await transaction.medIntake.create({
          data: {
            medicationId,
            doseKey: `${medicationId}:rollback:0`,
            scheduledForDate: "2026-08-13",
            doseIndex: 0,
          },
        });
        await transaction.medication.update({
          where: { id: medicationId },
          data: { stockQuantity: { decrement: 1 } },
        });
        throw new Error("simulated failure");
      }),
      /simulated failure/,
    );
    assert.equal(
      await prisma.medIntake.count({
        where: { doseKey: `${medicationId}:rollback:0` },
      }),
      0,
    );
    assert.equal(
      Number(
        (
          await prisma.medication.findUniqueOrThrow({
            where: { id: medicationId },
            select: { stockQuantity: true },
          })
        ).stockQuantity,
      ),
      2,
    );

    const recordConcurrentIntake = async (doseIndex: number) =>
      prisma.$transaction(async (transaction) => {
        await lockMedication(transaction);
        const inventory = await transaction.medication.findUniqueOrThrow({
          where: { id: medicationId },
          select: { stockQuantity: true, unitsPerDose: true },
        });
        assert.ok(inventory.stockQuantity && inventory.unitsPerDose);
        assert.ok(
          Number(inventory.stockQuantity) >= Number(inventory.unitsPerDose),
        );
        const intake = await transaction.medIntake.create({
          data: {
            medicationId,
            doseKey: `${medicationId}:concurrent:${doseIndex}`,
            scheduledForDate: "2026-08-13",
            doseIndex,
          },
        });
        await transaction.medication.update({
          where: { id: medicationId },
          data: { stockQuantity: { decrement: inventory.unitsPerDose } },
        });
        await transaction.medicationInventoryEvent.create({
          data: {
            medicationId,
            medIntakeId: intake.id,
            quantityDelta: -Number(inventory.unitsPerDose),
            reason: "intake",
          },
        });
      });

    await Promise.all([recordConcurrentIntake(0), recordConcurrentIntake(1)]);
    const [medication, inventoryEvents] = await Promise.all([
      prisma.medication.findUniqueOrThrow({ where: { id: medicationId } }),
      prisma.medicationInventoryEvent.count({ where: { medicationId } }),
    ]);
    assert.equal(Number(medication.stockQuantity), 0);
    assert.equal(inventoryEvents, 2);

    const stockOperationId = `stock-retry-${suffix}`;
    const applyIdempotentStockAdjustment = async () =>
      prisma.$transaction(async (transaction) => {
        const priorResult = await getMedicationForOperation(transaction, {
          userId,
          operationId: stockOperationId,
          mutationType: "stock_adjustment",
          medicationId,
        });
        if (priorResult) return priorResult;

        await lockMedication(transaction);
        const updated = await transaction.medication.update({
          where: { id: medicationId },
          data: { stockQuantity: { increment: 1 } },
        });
        await transaction.medicationInventoryEvent.create({
          data: {
            medicationId,
            quantityDelta: 1,
            reason: "manual",
          },
        });
        await recordMedicationOperation(transaction, {
          userId,
          operationId: stockOperationId,
          medicationId,
          mutationType: "stock_adjustment",
        });
        return updated;
      });

    await Promise.all([
      applyIdempotentStockAdjustment(),
      applyIdempotentStockAdjustment(),
    ]);
    assert.equal(
      Number(
        (
          await prisma.medication.findUniqueOrThrow({
            where: { id: medicationId },
            select: { stockQuantity: true },
          })
        ).stockQuantity,
      ),
      1,
    );
    assert.equal(
      await prisma.medicationInventoryEvent.count({
        where: { medicationId, reason: "manual" },
      }),
      1,
    );
    assert.equal(
      await prisma.medicationMutationReceipt.count({
        where: { userId, operationId: stockOperationId },
      }),
      1,
    );

    const intake = await prisma.medIntake.findUniqueOrThrow({
      where: { doseKey: `${medicationId}:concurrent:0` },
    });
    await prisma.$transaction(async (transaction) => {
      await transaction.medicationIntakeRevision.create({
        data: {
          medIntakeId: intake.id,
          medicationId,
          actorId: userId,
          action: "cancelled",
          previousSkipped: intake.skipped,
          previousTakenAt: intake.takenAt,
          previousDoseIndex: intake.doseIndex,
          previousDateKey: intake.scheduledForDate,
        },
      });
      await transaction.medIntake.delete({ where: { id: intake.id } });
    });
    assert.equal(
      await prisma.medicationIntakeRevision.count({
        where: { medIntakeId: intake.id },
      }),
      1,
    );

    await deleteUserAccountAtomically({ id: userId, email: userEmail });
    assert.equal(
      await prisma.medicationIntakeRevision.count({
        where: { medicationId },
      }),
      0,
    );
    assert.equal(
      await prisma.externalDeletionJob.count({
        where: {
          resourceType: "vercel_blob_profile_image",
          resourceLocator: managedImage,
        },
      }),
      1,
    );

    console.log(
      JSON.stringify({
        ok: true,
        rollbackAtomic: true,
        concurrentStockSerialized: true,
        concurrentRetryIdempotent: true,
        cancellationAuditSurvivesIntakeDeletion: true,
        accountDeletionCascadesAudit: true,
        externalDeletionQueuedAtomically: true,
      }),
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.externalDeletionJob.deleteMany({
      where: { resourceLocator: managedImage },
    });
    await prisma.$disconnect();
  }
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verification failed");
  process.exitCode = 1;
});

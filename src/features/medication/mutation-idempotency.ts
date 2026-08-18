import type { Prisma } from "@prisma/client";
import { ActionError } from "@/lib/errors/action-error";

export type MedicationMutationType = "create" | "update" | "stock_adjustment";

export const getMedicationForOperation = async (
  transaction: Prisma.TransactionClient,
  params: {
    userId: string;
    operationId?: string;
    mutationType: MedicationMutationType;
    medicationId?: string;
  },
) => {
  if (!params.operationId) return null;

  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`medication-operation:${params.userId}:${params.operationId}`}, 0))
  `;
  const receipt = await transaction.medicationMutationReceipt.findUnique({
    where: {
      userId_operationId: {
        userId: params.userId,
        operationId: params.operationId,
      },
    },
  });
  if (!receipt) return null;
  if (
    receipt.mutationType !== params.mutationType ||
    (params.medicationId && receipt.medicationId !== params.medicationId)
  ) {
    throw new ActionError("This operation identifier was already used");
  }

  return transaction.medication.findFirstOrThrow({
    where: { id: receipt.medicationId, userId: params.userId },
  });
};

export const recordMedicationOperation = async (
  transaction: Prisma.TransactionClient,
  params: {
    userId: string;
    operationId?: string;
    medicationId: string;
    mutationType: MedicationMutationType;
  },
) => {
  if (!params.operationId) return;
  await transaction.medicationMutationReceipt.create({
    data: {
      userId: params.userId,
      operationId: params.operationId,
      medicationId: params.medicationId,
      mutationType: params.mutationType,
    },
  });
};

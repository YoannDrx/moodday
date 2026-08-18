import {
  getMedicationForOperation,
  recordMedicationOperation,
} from "@/features/medication/mutation-idempotency";
import { describe, expect, it, vi } from "vitest";

const createTransaction = () => ({
  $executeRaw: vi.fn(async () => 1),
  medicationMutationReceipt: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  medication: {
    findFirstOrThrow: vi.fn(),
  },
});

describe("medication mutation idempotency", () => {
  it("does not create an operational dependency for legacy calls", async () => {
    const transaction = createTransaction();

    await expect(
      getMedicationForOperation(transaction as never, {
        userId: "user-1",
        mutationType: "create",
      }),
    ).resolves.toBeNull();
    await recordMedicationOperation(transaction as never, {
      userId: "user-1",
      medicationId: "medication-1",
      mutationType: "create",
    });

    expect(transaction.$executeRaw).not.toHaveBeenCalled();
    expect(transaction.medicationMutationReceipt.create).not.toHaveBeenCalled();
  });

  it("locks an operation and returns null before the first execution", async () => {
    const transaction = createTransaction();
    transaction.medicationMutationReceipt.findUnique.mockResolvedValue(null);

    await expect(
      getMedicationForOperation(transaction as never, {
        userId: "user-1",
        operationId: "operation-1",
        mutationType: "update",
        medicationId: "medication-1",
      }),
    ).resolves.toBeNull();

    expect(transaction.$executeRaw).toHaveBeenCalledOnce();
    expect(
      transaction.medicationMutationReceipt.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        userId_operationId: {
          userId: "user-1",
          operationId: "operation-1",
        },
      },
    });
  });

  it("returns the original medication for an exact retry", async () => {
    const transaction = createTransaction();
    const medication = { id: "medication-1", userId: "user-1" };
    transaction.medicationMutationReceipt.findUnique.mockResolvedValue({
      medicationId: "medication-1",
      mutationType: "stock_adjustment",
    });
    transaction.medication.findFirstOrThrow.mockResolvedValue(medication);

    await expect(
      getMedicationForOperation(transaction as never, {
        userId: "user-1",
        operationId: "operation-1",
        mutationType: "stock_adjustment",
        medicationId: "medication-1",
      }),
    ).resolves.toBe(medication);
    expect(transaction.medication.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: "medication-1", userId: "user-1" },
    });
  });

  it("rejects reuse across resources or mutation types", async () => {
    const transaction = createTransaction();
    transaction.medicationMutationReceipt.findUnique.mockResolvedValue({
      medicationId: "medication-other",
      mutationType: "create",
    });

    await expect(
      getMedicationForOperation(transaction as never, {
        userId: "user-1",
        operationId: "operation-1",
        mutationType: "update",
        medicationId: "medication-1",
      }),
    ).rejects.toThrow("operation identifier was already used");
  });

  it("stores only a content-free receipt", async () => {
    const transaction = createTransaction();
    transaction.medicationMutationReceipt.create.mockResolvedValue({});

    await recordMedicationOperation(transaction as never, {
      userId: "user-1",
      operationId: "operation-1",
      medicationId: "medication-1",
      mutationType: "create",
    });

    expect(transaction.medicationMutationReceipt.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        operationId: "operation-1",
        medicationId: "medication-1",
        mutationType: "create",
      },
    });
  });
});

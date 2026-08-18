import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = {
    inputSchema: vi.fn(),
    action: vi.fn(),
  };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  getMedicationForOperation: vi.fn(),
  recordMedicationOperation: vi.fn(),
}));

vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));
vi.mock("@/features/medication/mutation-idempotency", () => ({
  getMedicationForOperation: mocks.getMedicationForOperation,
  recordMedicationOperation: mocks.recordMedicationOperation,
}));

import {
  adjustMedicationStock,
  archiveMedication,
  createMedication,
  deleteMedIntake,
  getMedicationById,
  getMedications,
  getPRNHistory,
  getPRNMedications,
  getTodayIntakes,
  logMedIntake,
  logPRNIntake,
  skipMedIntake,
  unarchiveMedication,
  updateMedication,
} from "@/features/medication/medication.action";

const user = { id: "medication-user", email: "user@moodday.invalid" };
const now = new Date("2026-08-10T08:00:00.000Z");
const medication = {
  id: "medication-1",
  userId: user.id,
  name: "Synthetic",
  dosage: "fixture-dose",
  frequency: "daily",
  isPRN: false,
  isArchived: false,
  scheduleTimes: ["08:00"],
  weeklyDay: null,
  startDate: "2026-08-01",
  endDate: null,
  stockQuantity: 10,
  unitsPerDose: 1,
  lowStockThreshold: 2,
  syncStatus: "synced",
  createdAt: now,
  updatedAt: now,
  intakes: [],
};
type MedicationWithDoseSlots = typeof medication & {
  doseSlots: unknown[];
};

type ActionHandler<T = unknown> = (args: {
  parsedInput?: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;

const invoke = async <T>(
  handler: unknown,
  args: Parameters<ActionHandler<T>>[0],
) => (handler as ActionHandler<T>)(args);

beforeEach(() => {
  vi.clearAllMocks();
  actionClient.inputSchema.mockReturnValue(actionClient);
  actionClient.action.mockImplementation((handler) => handler);
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    typeof callback === "function"
      ? callback(prisma as never)
      : Promise.all(callback),
  );
  vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
  vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
    timezone: "Europe/Paris",
  } as never);
  mocks.getMedicationForOperation.mockResolvedValue(null);
});

describe("medication actions", () => {
  it("creates and updates treatment, schedule, history and inventory atomically", async () => {
    vi.mocked(prisma.medication.create).mockResolvedValue(medication as never);
    vi.mocked(prisma.medicationHistory.create).mockResolvedValue({} as never);
    vi.mocked(prisma.medicationScheduleRevision.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );

    const created = await invoke<typeof medication>(createMedication, {
      parsedInput: {
        name: medication.name,
        dosage: medication.dosage,
        frequency: "daily",
        isPRN: false,
        scheduleTimes: ["08:00"],
        weeklyDay: null,
        startDate: "2026-08-01",
        endDate: null,
        stockQuantity: 10,
        unitsPerDose: 1,
        lowStockThreshold: 2,
        operationId: "create-operation",
      },
      ctx: { user },
    });
    expect(created.id).toBe(medication.id);
    expect(prisma.medicationHistory.create).toHaveBeenCalledOnce();
    expect(prisma.medicationScheduleRevision.create).toHaveBeenCalledOnce();
    expect(prisma.medicationInventoryEvent.create).toHaveBeenCalledOnce();

    vi.mocked(prisma.medication.findUnique).mockResolvedValueOnce({
      userId: user.id,
      dosage: medication.dosage,
      frequency: medication.frequency,
      scheduleTimes: medication.scheduleTimes,
      weeklyDay: null,
      unitsPerDose: 1,
      stockQuantity: 10,
      startDate: medication.startDate,
      endDate: null,
      createdAt: now,
    } as never);
    vi.mocked(prisma.medication.update).mockResolvedValueOnce({
      ...medication,
      dosage: "updated-dose",
      stockQuantity: 12,
    } as never);
    const updated = await invoke<typeof medication>(updateMedication, {
      parsedInput: {
        id: medication.id,
        name: medication.name,
        dosage: "updated-dose",
        frequency: "twice_daily",
        isPRN: false,
        scheduleTimes: ["08:00", "20:00"],
        weeklyDay: null,
        startDate: medication.startDate,
        endDate: null,
        stockQuantity: 12,
        unitsPerDose: 1,
        lowStockThreshold: 3,
        reason: "Synthetic adjustment",
        operationId: "update-operation",
      },
      ctx: { user },
    });
    expect(updated.dosage).toBe("updated-dose");
    expect(prisma.medicationHistory.create).toHaveBeenCalledTimes(2);
    expect(prisma.medicationScheduleRevision.create).toHaveBeenCalledTimes(2);
    expect(prisma.medicationInventoryEvent.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({ quantityDelta: 2, reason: "correction" }),
    });
    expect(mocks.recordMedicationOperation).toHaveBeenCalledTimes(2);
  });

  it("archives, restores and adjusts owned stock with an immutable event", async () => {
    vi.mocked(prisma.medication.findUnique).mockResolvedValue({
      userId: user.id,
      stockQuantity: 10,
    } as never);
    vi.mocked(prisma.medication.update)
      .mockResolvedValueOnce({ ...medication, isArchived: true } as never)
      .mockResolvedValueOnce({ ...medication, isArchived: false } as never)
      .mockResolvedValueOnce({ ...medication, stockQuantity: 15 } as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );

    await expect(
      invoke(archiveMedication, {
        parsedInput: { id: medication.id },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ isArchived: true });
    await expect(
      invoke(unarchiveMedication, {
        parsedInput: { id: medication.id },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ isArchived: false });
    await expect(
      invoke(adjustMedicationStock, {
        parsedInput: {
          medicationId: medication.id,
          quantityDelta: 5,
          reason: "refill",
          operationId: "stock-operation",
        },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ stockQuantity: 15 });
    expect(prisma.medicationInventoryEvent.create).toHaveBeenCalledWith({
      data: {
        medicationId: medication.id,
        quantityDelta: 5,
        reason: "refill",
      },
    });
  });

  it("returns bounded treatment lists and a single owned treatment", async () => {
    vi.mocked(prisma.medication.findMany).mockResolvedValueOnce([
      medication,
      { ...medication, id: "prn-1", isPRN: true },
    ] as never);
    const medications = await invoke<MedicationWithDoseSlots[]>(
      getMedications,
      {
        parsedInput: { includeArchived: false },
        ctx: { user },
      },
    );
    expect(medications[0]?.doseSlots).toHaveLength(1);
    expect(medications[1]?.doseSlots).toEqual([]);

    vi.mocked(prisma.medication.findUnique).mockResolvedValueOnce({
      ...medication,
      history: [],
      scheduleRevisions: [],
      inventoryEvents: [],
      intakeRevisions: [],
    } as never);
    await expect(
      invoke(getMedicationById, {
        parsedInput: { id: medication.id },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ id: medication.id });
  });

  it("logs, corrects, skips and cancels scheduled intakes with stock audit", async () => {
    vi.mocked(prisma.medication.findUnique).mockResolvedValue({
      userId: user.id,
      isPRN: false,
      unitsPerDose: 1,
      stockQuantity: 10,
    } as never);
    vi.mocked(prisma.medication.findUniqueOrThrow).mockResolvedValue({
      unitsPerDose: 1,
      stockQuantity: 10,
    } as never);
    vi.mocked(prisma.medIntake.findUnique).mockResolvedValue(null);
    const taken = {
      id: "intake-1",
      medicationId: medication.id,
      skipped: false,
      takenAt: now,
      doseIndex: 0,
      scheduledForDate: "2026-08-10",
      clientOperationId: null,
    };
    vi.mocked(prisma.medIntake.upsert)
      .mockResolvedValueOnce(taken as never)
      .mockResolvedValueOnce({ ...taken, skipped: true } as never);
    vi.mocked(prisma.medication.update).mockResolvedValue(medication as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );

    await expect(
      invoke(logMedIntake, {
        parsedInput: {
          medicationId: medication.id,
          note: "synthetic",
          doseIndex: 0,
          scheduledForDate: "2026-08-10",
          takenAt: now.toISOString(),
        },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ id: taken.id, skipped: false });
    await expect(
      invoke(skipMedIntake, {
        parsedInput: {
          medicationId: medication.id,
          reason: "synthetic",
          doseIndex: 0,
          scheduledForDate: "2026-08-10",
          takenAt: now.toISOString(),
        },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ id: taken.id, skipped: true });

    vi.mocked(prisma.medIntake.findUnique).mockResolvedValueOnce({
      ...taken,
      medication,
    } as never);
    vi.mocked(prisma.medIntake.findUniqueOrThrow).mockResolvedValueOnce({
      ...taken,
      medication,
    } as never);
    vi.mocked(prisma.medicationIntakeRevision.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.medIntake.delete).mockResolvedValue(taken as never);
    await expect(
      invoke(deleteMedIntake, {
        parsedInput: { intakeId: taken.id },
        ctx: { user },
      }),
    ).resolves.toEqual({ success: true });
    expect(prisma.medicationIntakeRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "cancelled", actorId: user.id }),
    });
  });

  it("returns today's schedules and handles PRN intake and history", async () => {
    vi.mocked(prisma.medication.findMany)
      .mockResolvedValueOnce([medication] as never)
      .mockResolvedValueOnce([
        { ...medication, id: "prn-1", isPRN: true },
      ] as never);
    const today = await invoke<MedicationWithDoseSlots[]>(getTodayIntakes, {
      ctx: { user },
    });
    expect(today[0]?.doseSlots).toHaveLength(1);
    const prn = await invoke<(typeof medication)[]>(getPRNMedications, {
      ctx: { user },
    });
    expect(prn[0]?.isPRN).toBe(true);

    vi.mocked(prisma.medication.findUnique).mockResolvedValue({
      userId: user.id,
      isPRN: true,
      unitsPerDose: 1,
      stockQuantity: 10,
    } as never);
    vi.mocked(prisma.medication.findUniqueOrThrow).mockResolvedValue({
      unitsPerDose: 1,
      stockQuantity: 10,
    } as never);
    vi.mocked(prisma.medIntake.create).mockResolvedValue({
      id: "prn-intake-1",
      medicationId: "prn-1",
    } as never);
    vi.mocked(prisma.medication.update).mockResolvedValue(medication as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );
    await expect(
      invoke(logPRNIntake, {
        parsedInput: {
          medicationId: "prn-1",
          reason: "synthetic",
          takenAt: now.toISOString(),
        },
        ctx: { user },
      }),
    ).resolves.toMatchObject({ id: "prn-intake-1" });

    vi.mocked(prisma.medIntake.findMany).mockResolvedValueOnce([
      { id: "prn-intake-1" },
    ] as never);
    await expect(
      invoke(getPRNHistory, {
        parsedInput: { medicationId: "prn-1" },
        ctx: { user },
      }),
    ).resolves.toEqual([{ id: "prn-intake-1" }]);
  });
});

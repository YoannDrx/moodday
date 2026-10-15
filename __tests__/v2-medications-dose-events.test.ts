import {
  createDoseEventSchema,
  createMedicationSchema as createMedicationContractSchema,
  doseEventWriteSchema,
  updateMedicationSchema as updateMedicationContractSchema,
} from "@moodday/contracts";
import fs from "node:fs";
import path from "node:path";
import {
  createDoseEvent,
  createDoseEventCorrection,
  createMedication,
  createMedicationInventoryAdjustment,
  listDoseEvents,
  listMedications,
  updateMedication,
} from "@/features/v2/medications/service";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const timestamp = new Date("2026-08-23T07:30:00.000Z");
const selectedEvent = {
  id: "dose-event-1",
  medicationId: "medication-1",
  takenAt: timestamp,
  skipped: false,
  note: null,
  scheduledForDate: "2026-08-23",
  timezone: "Europe/Paris",
  doseIndex: 0,
  clientOperationId: "operation-dose-1",
  cancelledAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  medication: { isPRN: false },
};

const selectedMedication = {
  id: "medication-1",
  name: "Lamotrigine",
  dosage: "100 mg",
  frequency: "daily",
  isPRN: false,
  isArchived: false,
  scheduleTimes: ["08:00"],
  weeklyDay: null,
  startDate: "2026-08-01",
  endDate: null,
  stockQuantity: 12,
  unitsPerDose: 1,
  lowStockThreshold: 5,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const input = {
  operationId: "operation-dose-1",
  entityId: "dose-event-1",
  medicationId: "medication-1",
  kind: "taken" as const,
  localDate: "2026-08-23",
  timezone: "Europe/Paris",
  occurredAt: timestamp.toISOString(),
  doseIndex: 0,
};

describe("Mood Day V2 medications and dose events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a PRN dose index and requires one for scheduled doses", () => {
    expect(
      doseEventWriteSchema.safeParse({
        ...input,
        kind: "prn",
        doseIndex: 0,
      }).success,
    ).toBe(false);
    expect(
      doseEventWriteSchema.safeParse({
        ...input,
        kind: "taken",
        doseIndex: null,
      }).success,
    ).toBe(false);
    expect(createDoseEventSchema.safeParse(input).success).toBe(true);
  });

  it("validates complete treatment schedules before they reach storage", () => {
    const base = {
      operationId: "operation-medication-1",
      entityId: "medication-created-1",
      localDate: "2026-08-23",
      timezone: "Europe/Paris",
      name: "Lamotrigine",
      dosage: "100 mg",
      frequency: "twice_daily" as const,
      scheduleTimes: ["09:00", "20:00"],
      weeklyDay: null,
      startDate: null,
      endDate: null,
      stockQuantity: 30,
      unitsPerDose: 1,
      lowStockThreshold: 5,
    };
    expect(createMedicationContractSchema.safeParse(base).success).toBe(true);
    expect(
      createMedicationContractSchema.safeParse({
        ...base,
        scheduleTimes: ["09:00"],
      }).success,
    ).toBe(false);
    expect(
      updateMedicationContractSchema.safeParse({
        operationId: base.operationId,
        localDate: base.localDate,
        timezone: base.timezone,
        name: base.name,
        dosage: base.dosage,
        frequency: base.frequency,
        scheduleTimes: base.scheduleTimes,
        weeklyDay: base.weeklyDay,
        startDate: base.startDate,
        endDate: base.endDate,
        stockQuantity: base.stockQuantity,
        unitsPerDose: base.unitsPerDose,
        lowStockThreshold: base.lowStockThreshold,
        medicationId: "medication-1",
        reason: "Ordonnance actualisée",
        baseVersion: timestamp.toISOString(),
      }).success,
    ).toBe(true);
  });

  it("creates a treatment with initial schedule, dosage and stock history", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medication.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medication.create).mockResolvedValue(
      selectedMedication as never,
    );
    vi.mocked(prisma.medicationHistory.create).mockResolvedValue({} as never);
    vi.mocked(prisma.medicationScheduleRevision.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(
      createMedication("user-1", {
        operationId: "operation-medication-1",
        entityId: "medication-created-1",
        localDate: "2026-08-23",
        timezone: "Europe/Paris",
        name: "Lamotrigine",
        dosage: "100 mg",
        frequency: "daily",
        scheduleTimes: ["09:00"],
        weeklyDay: null,
        startDate: null,
        endDate: null,
        stockQuantity: 12,
        unitsPerDose: 1,
        lowStockThreshold: 5,
      }),
    ).resolves.toMatchObject({ name: "Lamotrigine", stockQuantity: 12 });
    expect(prisma.medicationHistory.create).toHaveBeenCalledOnce();
    expect(prisma.medicationScheduleRevision.create).toHaveBeenCalledOnce();
    expect(prisma.medicationInventoryEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantityDelta: 12,
        note: "Stock initial déclaré",
      }),
    });
  });

  it("updates a treatment with optimistic concurrency and append-only histories", async () => {
    const updatedAt = new Date("2026-08-23T09:00:00.000Z");
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue(
      selectedMedication as never,
    );
    vi.mocked(prisma.medication.update).mockResolvedValue({
      ...selectedMedication,
      dosage: "150 mg",
      stockQuantity: 20,
      updatedAt,
    } as never);
    vi.mocked(prisma.medicationHistory.create).mockResolvedValue({} as never);
    vi.mocked(prisma.medicationScheduleRevision.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(
      updateMedication("user-1", {
        operationId: "operation-medication-update-1",
        medicationId: "medication-1",
        localDate: "2026-08-23",
        timezone: "Europe/Paris",
        name: "Lamotrigine",
        dosage: "150 mg",
        frequency: "daily",
        scheduleTimes: ["09:00"],
        weeklyDay: null,
        startDate: "2026-08-01",
        endDate: null,
        stockQuantity: 20,
        unitsPerDose: 1,
        lowStockThreshold: 5,
        reason: "Ordonnance actualisée",
        baseVersion: timestamp.toISOString(),
      }),
    ).resolves.toMatchObject({ dosage: "150 mg", stockQuantity: 20 });
    expect(prisma.medicationHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        previousDosage: "100 mg",
        reason: "Ordonnance actualisée",
      }),
    });
    expect(prisma.medicationInventoryEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ quantityDelta: 8 }),
    });
  });

  it("adds only nullable civil-time context and upgrades the SQLCipher queue", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "prisma/migrations/20260823003000_med_intake_timezone/migration.sql",
      ),
      "utf8",
    );
    const localDatabase = fs.readFileSync(
      path.join(process.cwd(), "apps/mobile/src/lib/local-database.ts"),
      "utf8",
    );

    expect(migration).toContain('ADD COLUMN "timezone" TEXT');
    expect(migration).not.toMatch(/NOT NULL|DROP TABLE|DELETE FROM/iu);
    expect(localDatabase).toContain("pending_sync_operation_v4");
    expect(localDatabase).toContain("'dose_event'");
    expect(localDatabase).toContain("PRAGMA user_version = 4");
  });

  it("adds the V2 correction audit fields without deleting existing data", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "prisma/migrations/20260823160000_v2_dose_corrections/migration.sql",
      ),
      "utf8",
    );
    const localDatabase = fs.readFileSync(
      path.join(process.cwd(), "apps/mobile/src/lib/local-database.ts"),
      "utf8",
    );

    expect(migration).toContain('ADD COLUMN "cancelledAt" TIMESTAMP(3)');
    expect(migration).toContain('ADD COLUMN "operationId" TEXT');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "medication_intake_revision_actorId_operationId_key"',
    );
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/iu);
    expect(localDatabase).toContain("pending_sync_operation_v7");
    expect(localDatabase).toContain("'dose_event_correction'");
    expect(localDatabase).toContain("'medication_inventory_event'");
    expect(localDatabase).toContain("PRAGMA user_version = 7");
    expect(localDatabase).toContain("pending_sync_operation_v8");
    expect(localDatabase).toContain("'check_in', 'medication', 'dose_event'");
    expect(localDatabase).toContain("PRAGMA user_version = 8");
  });

  it("lists only the authenticated user's active treatments", async () => {
    vi.mocked(prisma.medication.findMany).mockResolvedValue([]);

    await expect(
      listMedications({ userId: "user-1", cursor: "medication-before" }),
    ).resolves.toEqual({ items: [], nextCursor: null });
    expect(prisma.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isArchived: false },
        cursor: { id: "medication-before" },
        skip: 1,
      }),
    );
  });

  it("keeps the requested civil date for legacy events without stored timezone", async () => {
    vi.mocked(prisma.medIntake.findMany).mockResolvedValue([
      {
        ...selectedEvent,
        takenAt: new Date("2026-08-22T22:30:00.000Z"),
        scheduledForDate: null,
        timezone: null,
      },
    ] as never);
    vi.mocked(prisma.medicationIntakeRevision.groupBy).mockResolvedValue([]);

    await expect(
      listDoseEvents({
        userId: "user-1",
        localDate: "2026-08-23",
        timezone: "Europe/Paris",
      }),
    ).resolves.toMatchObject([
      { localDate: "2026-08-23", timezone: "Europe/Paris" },
    ]);
    expect(prisma.medIntake.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ medication: { userId: "user-1" } }),
      }),
    );
  });

  it("corrects a dose through an append-only revision and restores consumed stock", async () => {
    const correctedAt = new Date("2026-08-23T08:00:00.000Z");
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medicationIntakeRevision.findUnique).mockResolvedValue(
      null,
    );
    vi.mocked(prisma.medicationIntakeRevision.count).mockResolvedValue(0);
    vi.mocked(prisma.medIntake.findFirst)
      .mockResolvedValueOnce({ medicationId: "medication-1" } as never)
      .mockResolvedValueOnce({
        ...selectedEvent,
        medication: {
          userId: "user-1",
          isPRN: false,
          unitsPerDose: 1,
          stockQuantity: 11,
        },
      } as never);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medIntake.update).mockResolvedValue({
      ...selectedEvent,
      takenAt: correctedAt,
      skipped: true,
      note: "Pas prise",
      clientOperationId: "operation-correction-1",
      updatedAt: correctedAt,
    } as never);
    vi.mocked(prisma.medication.update).mockResolvedValue({} as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.medicationIntakeRevision.create).mockResolvedValue({
      id: "correction-1",
      medIntakeId: "dose-event-1",
      medicationId: "medication-1",
      operationId: "operation-correction-1",
      action: "corrected",
      previousSkipped: false,
      nextSkipped: true,
      previousTakenAt: timestamp,
      nextTakenAt: correctedAt,
      previousNote: null,
      nextNote: "Pas prise",
      reason: "Erreur de saisie",
      timezone: "Europe/Paris",
      createdAt: correctedAt,
    } as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(
      createDoseEventCorrection("user-1", {
        operationId: "operation-correction-1",
        entityId: "correction-1",
        doseEventId: "dose-event-1",
        targetKind: "skipped",
        occurredAt: correctedAt.toISOString(),
        timezone: "Europe/Paris",
        note: "Pas prise",
        reason: "Erreur de saisie",
        baseVersion: timestamp.toISOString(),
      }),
    ).resolves.toMatchObject({
      event: { id: "dose-event-1", kind: "skipped", correctionCount: 1 },
      correction: {
        id: "correction-1",
        previousKind: "taken",
        targetKind: "skipped",
      },
    });
    expect(prisma.medIntake.delete).not.toHaveBeenCalled();
    expect(prisma.medicationIntakeRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          previousSkipped: false,
          nextSkipped: true,
          reason: "Erreur de saisie",
        }),
      }),
    );
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: "medication-1" },
      data: { stockQuantity: { increment: 1 } },
    });
  });

  it("rejects stale stock changes and records valid inventory adjustments", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medicationInventoryEvent.findUnique).mockResolvedValue(
      null,
    );
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({
      ...selectedMedication,
      updatedAt: new Date("2026-08-23T08:00:00.000Z"),
    } as never);

    await expect(
      createMedicationInventoryAdjustment("user-1", {
        operationId: "operation-inventory-stale",
        entityId: "inventory-stale",
        medicationId: "medication-1",
        quantityDelta: 30,
        reason: "refill",
        occurredAt: timestamp.toISOString(),
        baseVersion: timestamp.toISOString(),
      }),
    ).rejects.toMatchObject({ code: "medication_version_conflict" });
    expect(prisma.medication.update).not.toHaveBeenCalled();

    vi.clearAllMocks();
    const updatedAt = new Date("2026-08-23T08:00:00.000Z");
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medicationInventoryEvent.findUnique).mockResolvedValue(
      null,
    );
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue(
      selectedMedication as never,
    );
    vi.mocked(prisma.medication.update).mockResolvedValue({
      ...selectedMedication,
      stockQuantity: 42,
      updatedAt,
    } as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue({
      id: "inventory-1",
      medicationId: "medication-1",
      medIntakeId: null,
      quantityDelta: 30,
      reason: "refill",
      note: "Nouvelle boîte",
      occurredAt: updatedAt,
      createdAt: updatedAt,
    } as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(
      createMedicationInventoryAdjustment("user-1", {
        operationId: "operation-inventory-1",
        entityId: "inventory-1",
        medicationId: "medication-1",
        quantityDelta: 30,
        reason: "refill",
        occurredAt: updatedAt.toISOString(),
        note: "Nouvelle boîte",
        baseVersion: timestamp.toISOString(),
      }),
    ).resolves.toMatchObject({
      medication: { stockQuantity: 42 },
      inventoryEvent: { quantityDelta: 30, reason: "refill" },
    });
  });

  it("records a scheduled dose and decrements available stock atomically", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medIntake.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({
      id: "medication-1",
      isPRN: false,
      unitsPerDose: 1,
      stockQuantity: 12,
    } as never);
    vi.mocked(prisma.medIntake.create).mockResolvedValue(
      selectedEvent as never,
    );
    vi.mocked(prisma.medication.update).mockResolvedValue({} as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(createDoseEvent("user-1", input)).resolves.toMatchObject({
      id: "dose-event-1",
      kind: "taken",
      localDate: "2026-08-23",
      timezone: "Europe/Paris",
    });
    expect(prisma.medIntake.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          doseKey: "medication-1:2026-08-23:0",
          clientOperationId: "operation-dose-1",
          timezone: "Europe/Paris",
        }),
      }),
    );
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: "medication-1" },
      data: { stockQuantity: { decrement: 1 } },
    });
    const receipt = vi.mocked(prisma.syncOperation.create).mock.calls[0]?.[0]
      ?.data;
    expect(receipt).toMatchObject({
      userId: "user-1",
      operationId: "operation-dose-1",
      entityType: "dose_event",
      entityId: "dose-event-1",
      status: "applied",
    });
    expect(receipt.payloadDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("replays the same operation but rejects a second event for one scheduled slot", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValueOnce({
      entityType: "dose_event",
      entityId: "dose-event-1",
    } as never);
    vi.mocked(prisma.medIntake.findFirst).mockResolvedValue(
      selectedEvent as never,
    );

    await expect(createDoseEvent("user-1", input)).resolves.toMatchObject({
      id: "dose-event-1",
    });
    expect(prisma.medIntake.create).not.toHaveBeenCalled();

    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medIntake.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ createdAt: timestamp } as never);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({
      id: "medication-1",
      isPRN: false,
      unitsPerDose: null,
      stockQuantity: null,
    } as never);

    await expect(
      createDoseEvent("user-1", {
        ...input,
        operationId: "operation-dose-2",
        entityId: "dose-event-2",
      }),
    ).rejects.toMatchObject({
      code: "scheduled_dose_exists",
      currentVersion: timestamp,
    });
    expect(prisma.medIntake.create).not.toHaveBeenCalled();
  });
});

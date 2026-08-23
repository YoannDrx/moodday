import type {
  CreateDoseEventCorrectionInput,
  CreateDoseEventInput,
  CreateMedicationInventoryAdjustmentInput,
  CreateMedicationInput,
  DoseEventCorrectionDto,
  DoseEventCorrectionResult,
  DoseEventDto,
  EffectiveDoseEventKind,
  MedicationDetailDto,
  MedicationDto,
  MedicationInventoryAdjustmentResult,
  MedicationInventoryEventDto,
  UpdateMedicationInput,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { getExportDateRange } from "@/features/export/date-range";
import {
  createScheduledDoseKey,
  normalizeScheduleTimesForFrequency,
} from "@/features/medication/schedule";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";

type Transaction = Prisma.TransactionClient;

export const medicationSelection = {
  id: true,
  name: true,
  dosage: true,
  frequency: true,
  isPRN: true,
  isArchived: true,
  scheduleTimes: true,
  weeklyDay: true,
  startDate: true,
  endDate: true,
  stockQuantity: true,
  unitsPerDose: true,
  lowStockThreshold: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedMedication = Prisma.MedicationGetPayload<{
  select: typeof medicationSelection;
}>;

export const doseEventSelection = {
  id: true,
  medicationId: true,
  takenAt: true,
  skipped: true,
  note: true,
  scheduledForDate: true,
  timezone: true,
  doseIndex: true,
  clientOperationId: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  medication: { select: { isPRN: true } },
} as const;

type SelectedDoseEvent = Prisma.MedIntakeGetPayload<{
  select: typeof doseEventSelection;
}>;

export class DoseEventServiceError extends Error {
  readonly code: string;
  readonly currentVersion: Date | null;

  constructor(code: string, currentVersion: Date | null = null) {
    super(code);
    this.name = "DoseEventServiceError";
    this.code = code;
    this.currentVersion = currentVersion;
  }
}

export const correctionSelection = {
  id: true,
  medIntakeId: true,
  medicationId: true,
  operationId: true,
  action: true,
  previousSkipped: true,
  nextSkipped: true,
  previousTakenAt: true,
  nextTakenAt: true,
  previousNote: true,
  nextNote: true,
  reason: true,
  timezone: true,
  createdAt: true,
} as const;

type SelectedCorrection = Prisma.MedicationIntakeRevisionGetPayload<{
  select: typeof correctionSelection;
}>;

export const inventoryEventSelection = {
  id: true,
  medicationId: true,
  medIntakeId: true,
  quantityDelta: true,
  reason: true,
  note: true,
  occurredAt: true,
  createdAt: true,
} as const;

type SelectedInventoryEvent = Prisma.MedicationInventoryEventGetPayload<{
  select: typeof inventoryEventSelection;
}>;

const decimalToNumber = (value: Prisma.Decimal | null) =>
  value === null ? null : Number(value);

export const toMedicationDto = (
  medication: SelectedMedication,
): MedicationDto => ({
  id: medication.id,
  name: medication.name,
  dosage: medication.dosage,
  frequency: medication.frequency as MedicationDto["frequency"],
  isPrn: medication.isPRN,
  isArchived: medication.isArchived,
  scheduleTimes: medication.scheduleTimes,
  weeklyDay: medication.weeklyDay,
  startDate: medication.startDate,
  endDate: medication.endDate,
  stockQuantity: decimalToNumber(medication.stockQuantity),
  unitsPerDose: decimalToNumber(medication.unitsPerDose),
  lowStockThreshold: decimalToNumber(medication.lowStockThreshold),
  createdAt: medication.createdAt.toISOString(),
  updatedAt: medication.updatedAt.toISOString(),
});

const getEffectiveDoseKind = (event: {
  cancelledAt: Date | null;
  skipped: boolean;
  medication: { isPRN: boolean };
}): EffectiveDoseEventKind => {
  if (event.cancelledAt) return "cancelled";
  if (event.skipped) return "skipped";
  return event.medication.isPRN ? "prn" : "taken";
};

export const toDoseEventDto = (
  event: SelectedDoseEvent,
  fallbackTimezone: string,
  fallbackLocalDate?: string,
  correctionCount = 0,
): DoseEventDto => ({
  id: event.id,
  medicationId: event.medicationId,
  operationId: event.clientOperationId,
  kind: getEffectiveDoseKind(event),
  localDate:
    event.scheduledForDate ??
    fallbackLocalDate ??
    event.takenAt.toISOString().slice(0, 10),
  timezone: event.timezone ?? fallbackTimezone,
  occurredAt: event.takenAt.toISOString(),
  doseIndex: event.doseIndex,
  note: event.note,
  cancelledAt: event.cancelledAt?.toISOString() ?? null,
  correctionCount,
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString(),
});

const inferRevisionKind = ({
  action,
  skipped,
  isPrn,
}: {
  action?: string;
  skipped: boolean | null;
  isPrn: boolean;
}): EffectiveDoseEventKind => {
  if (action === "cancelled") return "cancelled";
  if (skipped) return "skipped";
  return isPrn ? "prn" : "taken";
};

export const toDoseEventCorrectionDto = (
  correction: SelectedCorrection,
  { isPrn }: { isPrn: boolean },
): DoseEventCorrectionDto => ({
  id: correction.id,
  doseEventId: correction.medIntakeId,
  medicationId: correction.medicationId,
  operationId: correction.operationId ?? correction.id,
  previousKind: inferRevisionKind({
    skipped: correction.previousSkipped,
    isPrn,
  }),
  targetKind: inferRevisionKind({
    action: correction.action,
    skipped: correction.nextSkipped,
    isPrn,
  }),
  previousOccurredAt: (
    correction.previousTakenAt ?? correction.createdAt
  ).toISOString(),
  occurredAt: (correction.nextTakenAt ?? correction.createdAt).toISOString(),
  timezone: correction.timezone ?? "Europe/Paris",
  previousNote: correction.previousNote,
  note: correction.nextNote,
  reason: correction.reason ?? "Correction enregistrée",
  createdAt: correction.createdAt.toISOString(),
});

export const toMedicationInventoryEventDto = (
  event: SelectedInventoryEvent,
): MedicationInventoryEventDto => ({
  id: event.id,
  medicationId: event.medicationId,
  doseEventId: event.medIntakeId,
  quantityDelta: Number(event.quantityDelta),
  reason: event.reason,
  note: event.note,
  occurredAt: event.occurredAt.toISOString(),
  createdAt: event.createdAt.toISOString(),
});

export const listMedications = async ({
  userId,
  includeArchived = false,
  cursor,
  limit = 50,
}: {
  userId: string;
  includeArchived?: boolean;
  cursor?: string;
  limit?: number;
}) => {
  const rows = await prisma.medication.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: medicationSelection,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page.map(toMedicationDto),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
};

const normalizeMedicationInput = <
  T extends CreateMedicationInput | UpdateMedicationInput,
>(
  input: T,
) => ({
  ...input,
  scheduleTimes: normalizeScheduleTimesForFrequency(
    input.frequency,
    input.scheduleTimes,
  ),
  weeklyDay: input.frequency === "weekly" ? input.weeklyDay : null,
  isPRN: input.frequency === "prn",
});

export const createMedicationInTransaction = async ({
  transaction,
  userId,
  input,
}: {
  transaction: Transaction;
  userId: string;
  input: CreateMedicationInput;
}): Promise<SelectedMedication> => {
  const existing = await transaction.medication.findUnique({
    where: { id: input.entityId },
    select: { userId: true, createdAt: true },
  });
  if (existing) {
    throw new DoseEventServiceError(
      existing.userId === userId ? "entity_id_exists" : "entity_not_found",
      existing.createdAt,
    );
  }
  const normalized = normalizeMedicationInput(input);
  const effectiveDate = normalized.startDate ?? input.localDate;
  if (normalized.endDate && normalized.endDate < effectiveDate) {
    throw new DoseEventServiceError("end_date_before_start_date");
  }
  const medication = await transaction.medication.create({
    data: {
      id: input.entityId,
      userId,
      name: normalized.name,
      dosage: normalized.dosage,
      frequency: normalized.frequency,
      isPRN: normalized.isPRN,
      scheduleTimes: normalized.scheduleTimes,
      weeklyDay: normalized.weeklyDay,
      startDate: effectiveDate,
      endDate: normalized.endDate,
      stockQuantity: normalized.stockQuantity,
      unitsPerDose: normalized.unitsPerDose,
      lowStockThreshold: normalized.lowStockThreshold,
      syncStatus: "synced",
    },
    select: medicationSelection,
  });
  await Promise.all([
    transaction.medicationHistory.create({
      data: {
        medicationId: medication.id,
        dosage: medication.dosage,
        reason: "Dosage initial déclaré",
      },
    }),
    transaction.medicationScheduleRevision.create({
      data: {
        medicationId: medication.id,
        effectiveDate,
        dosage: medication.dosage,
        frequency: medication.frequency,
        scheduleTimes: medication.scheduleTimes,
        weeklyDay: medication.weeklyDay,
        unitsPerDose: medication.unitsPerDose,
        reason: "Régime initial déclaré",
        authoredById: userId,
      },
    }),
    ...(normalized.stockQuantity !== null && normalized.stockQuantity > 0
      ? [
          transaction.medicationInventoryEvent.create({
            data: {
              medicationId: medication.id,
              quantityDelta: normalized.stockQuantity,
              reason: "manual",
              note: "Stock initial déclaré",
            },
          }),
        ]
      : []),
  ]);
  return medication;
};

export const updateMedicationInTransaction = async ({
  transaction,
  userId,
  input,
}: {
  transaction: Transaction;
  userId: string;
  input: UpdateMedicationInput;
}): Promise<SelectedMedication> => {
  await lockMedication(transaction, input.medicationId);
  const existing = await transaction.medication.findFirst({
    where: { id: input.medicationId, userId },
    select: medicationSelection,
  });
  if (!existing) throw new DoseEventServiceError("medication_not_found");
  if (new Date(input.baseVersion).getTime() !== existing.updatedAt.getTime()) {
    throw new DoseEventServiceError(
      "medication_version_conflict",
      existing.updatedAt,
    );
  }
  const normalized = normalizeMedicationInput(input);
  const nextStartDate = normalized.startDate ?? input.localDate;
  if (normalized.endDate && normalized.endDate < nextStartDate) {
    throw new DoseEventServiceError("end_date_before_start_date");
  }
  const dosageChanged = existing.dosage !== normalized.dosage;
  const scheduleChanged =
    dosageChanged ||
    existing.frequency !== normalized.frequency ||
    existing.weeklyDay !== normalized.weeklyDay ||
    Number(existing.unitsPerDose ?? 0) !==
      Number(normalized.unitsPerDose ?? 0) ||
    JSON.stringify(existing.scheduleTimes) !==
      JSON.stringify(normalized.scheduleTimes);
  const previousStock = Number(existing.stockQuantity ?? 0);
  const nextStock = Number(normalized.stockQuantity ?? 0);
  const stockDelta = nextStock - previousStock;
  const medication = await transaction.medication.update({
    where: { id: existing.id },
    data: {
      name: normalized.name,
      dosage: normalized.dosage,
      frequency: normalized.frequency,
      isPRN: normalized.isPRN,
      scheduleTimes: normalized.scheduleTimes,
      weeklyDay: normalized.weeklyDay,
      startDate: nextStartDate,
      endDate: normalized.endDate,
      stockQuantity: normalized.stockQuantity,
      unitsPerDose: normalized.unitsPerDose,
      lowStockThreshold: normalized.lowStockThreshold,
    },
    select: medicationSelection,
  });
  await Promise.all([
    ...(dosageChanged
      ? [
          transaction.medicationHistory.create({
            data: {
              medicationId: medication.id,
              dosage: medication.dosage,
              previousDosage: existing.dosage,
              reason: input.reason,
            },
          }),
        ]
      : []),
    ...(scheduleChanged
      ? [
          transaction.medicationScheduleRevision.create({
            data: {
              medicationId: medication.id,
              effectiveDate: input.localDate,
              dosage: medication.dosage,
              frequency: medication.frequency,
              scheduleTimes: medication.scheduleTimes,
              weeklyDay: medication.weeklyDay,
              unitsPerDose: medication.unitsPerDose,
              reason: input.reason,
              authoredById: userId,
            },
          }),
        ]
      : []),
    ...(stockDelta !== 0
      ? [
          transaction.medicationInventoryEvent.create({
            data: {
              medicationId: medication.id,
              quantityDelta: stockDelta,
              reason: "correction",
              note: input.reason,
            },
          }),
        ]
      : []),
  ]);
  return medication;
};

export const createMedication = async (
  userId: string,
  input: CreateMedicationInput,
): Promise<MedicationDto> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt) {
      if (receipt.entityType !== "medication" || !receipt.entityId) {
        throw new DoseEventServiceError("operation_id_conflict");
      }
      const existing = await transaction.medication.findFirst({
        where: { id: receipt.entityId, userId },
        select: medicationSelection,
      });
      if (!existing) throw new DoseEventServiceError("operation_id_conflict");
      return toMedicationDto(existing);
    }
    const medication = await createMedicationInTransaction({
      transaction,
      userId,
      input,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "medication",
        entityId: medication.id,
        mutation: "create",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return toMedicationDto(medication);
  });

export const updateMedication = async (
  userId: string,
  input: UpdateMedicationInput,
): Promise<MedicationDto> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt) {
      if (
        receipt.entityType !== "medication" ||
        receipt.entityId !== input.medicationId
      ) {
        throw new DoseEventServiceError("operation_id_conflict");
      }
      const existing = await transaction.medication.findFirst({
        where: { id: input.medicationId, userId },
        select: medicationSelection,
      });
      if (!existing) throw new DoseEventServiceError("operation_id_conflict");
      return toMedicationDto(existing);
    }
    const medication = await updateMedicationInTransaction({
      transaction,
      userId,
      input,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "medication",
        entityId: medication.id,
        mutation: "update",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return toMedicationDto(medication);
  });

export const listDoseEvents = async ({
  userId,
  localDate,
  timezone,
}: {
  userId: string;
  localDate: string;
  timezone: string;
}): Promise<DoseEventDto[]> => {
  const { start, endExclusive } = getExportDateRange({
    startDate: localDate,
    endDate: localDate,
    timezone,
  });
  const rows = await prisma.medIntake.findMany({
    where: {
      medication: { userId },
      OR: [
        { scheduledForDate: localDate },
        {
          scheduledForDate: null,
          takenAt: { gte: start, lt: endExclusive },
        },
      ],
    },
    orderBy: [{ takenAt: "desc" }, { id: "desc" }],
    select: doseEventSelection,
  });
  const eventIds = rows.map((event) => event.id);
  const correctionCounts =
    eventIds.length === 0
      ? []
      : await prisma.medicationIntakeRevision.groupBy({
          by: ["medIntakeId"],
          where: { medIntakeId: { in: eventIds } },
          _count: { _all: true },
        });
  const countByEventId = new Map(
    correctionCounts.map((value) => [value.medIntakeId, value._count._all]),
  );
  return rows.map((event) =>
    toDoseEventDto(
      event,
      timezone,
      localDate,
      countByEventId.get(event.id) ?? 0,
    ),
  );
};

const lockMedication = async (
  transaction: Transaction,
  medicationId: string,
) => {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`medication:${medicationId}`}, 0))
  `;
};

export const createDoseEventInTransaction = async ({
  transaction,
  userId,
  input,
}: {
  transaction: Transaction;
  userId: string;
  input: CreateDoseEventInput;
}): Promise<SelectedDoseEvent> => {
  const entity = await transaction.medIntake.findUnique({
    where: { id: input.entityId },
    select: {
      createdAt: true,
      medication: { select: { userId: true } },
    },
  });
  if (entity) {
    throw new DoseEventServiceError(
      entity.medication.userId === userId
        ? "entity_id_exists"
        : "entity_not_found",
      entity.createdAt,
    );
  }

  await lockMedication(transaction, input.medicationId);
  const medication = await transaction.medication.findFirst({
    where: { id: input.medicationId, userId, isArchived: false },
    select: {
      id: true,
      isPRN: true,
      unitsPerDose: true,
      stockQuantity: true,
    },
  });
  if (!medication) {
    throw new DoseEventServiceError("medication_not_found");
  }
  if (medication.isPRN !== (input.kind === "prn")) {
    throw new DoseEventServiceError("dose_kind_mismatch");
  }

  const doseKey =
    input.kind === "prn"
      ? null
      : createScheduledDoseKey(
          medication.id,
          input.localDate,
          input.doseIndex ?? 0,
        );
  if (doseKey) {
    const existingDose = await transaction.medIntake.findUnique({
      where: { doseKey },
      select: { createdAt: true },
    });
    if (existingDose) {
      throw new DoseEventServiceError(
        "scheduled_dose_exists",
        existingDose.createdAt,
      );
    }
  }

  const event = await transaction.medIntake.create({
    data: {
      id: input.entityId,
      medicationId: medication.id,
      takenAt: new Date(input.occurredAt),
      skipped: input.kind === "skipped",
      note: input.note ?? null,
      scheduledForDate: input.localDate,
      timezone: input.timezone,
      doseIndex: input.kind === "prn" ? null : input.doseIndex,
      doseKey,
      clientOperationId: input.operationId,
    },
    select: doseEventSelection,
  });

  if (
    input.kind !== "skipped" &&
    medication.unitsPerDose !== null &&
    medication.stockQuantity !== null &&
    Number(medication.stockQuantity) >= Number(medication.unitsPerDose)
  ) {
    await Promise.all([
      transaction.medication.update({
        where: { id: medication.id },
        data: { stockQuantity: { decrement: medication.unitsPerDose } },
      }),
      transaction.medicationInventoryEvent.create({
        data: {
          medicationId: medication.id,
          medIntakeId: event.id,
          quantityDelta: -Number(medication.unitsPerDose),
          reason: "intake",
        },
      }),
    ]);
  }

  return event;
};

export const createDoseEvent = async (
  userId: string,
  input: CreateDoseEventInput,
): Promise<DoseEventDto> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt && receipt.entityType !== "dose_event") {
      throw new DoseEventServiceError("operation_id_conflict");
    }
    if (receipt?.entityId) {
      const existing = await transaction.medIntake.findFirst({
        where: {
          id: receipt.entityId,
          medication: { userId },
        },
        select: doseEventSelection,
      });
      if (existing) return toDoseEventDto(existing, input.timezone);
      throw new DoseEventServiceError("operation_id_conflict");
    }
    if (receipt) throw new DoseEventServiceError("operation_id_conflict");

    const event = await createDoseEventInTransaction({
      transaction,
      userId,
      input,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "dose_event",
        entityId: event.id,
        mutation: "create",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return toDoseEventDto(event, input.timezone);
  });

const correctionEventSelection = {
  ...doseEventSelection,
  medication: {
    select: {
      userId: true,
      isPRN: true,
      unitsPerDose: true,
      stockQuantity: true,
    },
  },
} as const;

type SelectedCorrectionEvent = Prisma.MedIntakeGetPayload<{
  select: typeof correctionEventSelection;
}>;

const consumesStock = (kind: EffectiveDoseEventKind) =>
  kind === "taken" || kind === "prn";

const assertCorrectionKindMatchesMedication = (
  kind: EffectiveDoseEventKind,
  isPrn: boolean,
) => {
  const compatible = isPrn
    ? kind === "prn" || kind === "cancelled"
    : kind === "taken" || kind === "skipped" || kind === "cancelled";
  if (!compatible) throw new DoseEventServiceError("dose_kind_mismatch");
};

const adjustStockForCorrection = async ({
  transaction,
  event,
  previousKind,
  targetKind,
}: {
  transaction: Transaction;
  event: SelectedCorrectionEvent;
  previousKind: EffectiveDoseEventKind;
  targetKind: EffectiveDoseEventKind;
}) => {
  const units = event.medication.unitsPerDose;
  const stock = event.medication.stockQuantity;
  if (units === null || stock === null) return;
  const previouslyConsumed = consumesStock(previousKind);
  const nextConsumes = consumesStock(targetKind);
  if (previouslyConsumed === nextConsumes) return;

  const quantity = Number(units);
  if (!previouslyConsumed && Number(stock) < quantity) return;
  const quantityDelta = previouslyConsumed ? quantity : -quantity;
  await Promise.all([
    transaction.medication.update({
      where: { id: event.medicationId },
      data: {
        stockQuantity: previouslyConsumed
          ? { increment: units }
          : { decrement: units },
      },
    }),
    transaction.medicationInventoryEvent.create({
      data: {
        medicationId: event.medicationId,
        medIntakeId: event.id,
        quantityDelta,
        reason: "correction",
        note: "Ajustement automatique après correction de prise",
      },
    }),
  ]);
};

export const correctDoseEventInTransaction = async ({
  transaction,
  userId,
  input,
}: {
  transaction: Transaction;
  userId: string;
  input: CreateDoseEventCorrectionInput;
}): Promise<DoseEventCorrectionResult> => {
  const existingCorrection =
    await transaction.medicationIntakeRevision.findUnique({
      where: { id: input.entityId },
      select: { actorId: true, createdAt: true },
    });
  if (existingCorrection) {
    throw new DoseEventServiceError(
      existingCorrection.actorId === userId
        ? "entity_id_exists"
        : "entity_not_found",
      existingCorrection.createdAt,
    );
  }
  const owned = await transaction.medIntake.findFirst({
    where: { id: input.doseEventId, medication: { userId } },
    select: { medicationId: true },
  });
  if (!owned) throw new DoseEventServiceError("dose_event_not_found");

  await lockMedication(transaction, owned.medicationId);
  const current = await transaction.medIntake.findFirst({
    where: { id: input.doseEventId, medication: { userId } },
    select: correctionEventSelection,
  });
  if (!current) throw new DoseEventServiceError("dose_event_not_found");
  if (new Date(input.baseVersion).getTime() !== current.updatedAt.getTime()) {
    throw new DoseEventServiceError("dose_version_conflict", current.updatedAt);
  }

  assertCorrectionKindMatchesMedication(
    input.targetKind,
    current.medication.isPRN,
  );
  const previousKind = getEffectiveDoseKind(current);
  const nextNote = input.note ?? null;
  const nextOccurredAt = new Date(input.occurredAt);
  if (
    previousKind === input.targetKind &&
    current.takenAt.getTime() === nextOccurredAt.getTime() &&
    current.note === nextNote
  ) {
    throw new DoseEventServiceError("dose_correction_no_change");
  }
  const previousCorrectionCount =
    await transaction.medicationIntakeRevision.count({
      where: { medIntakeId: current.id },
    });

  await adjustStockForCorrection({
    transaction,
    event: current,
    previousKind,
    targetKind: input.targetKind,
  });

  const event = await transaction.medIntake.update({
    where: { id: current.id },
    data: {
      takenAt: nextOccurredAt,
      skipped: input.targetKind === "skipped",
      note: nextNote,
      timezone: input.timezone,
      cancelledAt: input.targetKind === "cancelled" ? new Date() : null,
      clientOperationId: input.operationId,
    },
    select: doseEventSelection,
  });
  const correction = await transaction.medicationIntakeRevision.create({
    data: {
      id: input.entityId,
      medIntakeId: current.id,
      medicationId: current.medicationId,
      actorId: userId,
      operationId: input.operationId,
      action: input.targetKind === "cancelled" ? "cancelled" : "corrected",
      previousSkipped: current.skipped,
      nextSkipped: input.targetKind === "skipped",
      previousTakenAt: current.takenAt,
      nextTakenAt: nextOccurredAt,
      previousDoseIndex: current.doseIndex,
      nextDoseIndex: current.doseIndex,
      previousDateKey: current.scheduledForDate,
      nextDateKey: current.scheduledForDate,
      previousNote: current.note,
      nextNote,
      reason: input.reason,
      timezone: input.timezone,
    },
    select: correctionSelection,
  });
  return {
    event: toDoseEventDto(
      event,
      input.timezone,
      event.scheduledForDate ?? undefined,
      previousCorrectionCount + 1,
    ),
    correction: toDoseEventCorrectionDto(correction, {
      isPrn: current.medication.isPRN,
    }),
  };
};

export const createDoseEventCorrection = async (
  userId: string,
  input: CreateDoseEventCorrectionInput,
): Promise<DoseEventCorrectionResult> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt) {
      if (
        receipt.entityType !== "dose_event_correction" ||
        receipt.entityId !== input.entityId
      ) {
        throw new DoseEventServiceError("operation_id_conflict");
      }
      const correction = await transaction.medicationIntakeRevision.findFirst({
        where: { id: input.entityId, actorId: userId },
        select: correctionSelection,
      });
      const event = await transaction.medIntake.findFirst({
        where: { id: input.doseEventId, medication: { userId } },
        select: doseEventSelection,
      });
      if (!correction || !event) {
        throw new DoseEventServiceError("operation_id_conflict");
      }
      const correctionCount = await transaction.medicationIntakeRevision.count({
        where: { medIntakeId: event.id },
      });
      return {
        event: toDoseEventDto(
          event,
          input.timezone,
          undefined,
          correctionCount,
        ),
        correction: toDoseEventCorrectionDto(correction, {
          isPrn: event.medication.isPRN,
        }),
      };
    }

    const result = await correctDoseEventInTransaction({
      transaction,
      userId,
      input,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "dose_event_correction",
        entityId: input.entityId,
        mutation: "create",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return result;
  });

export const adjustMedicationInventoryInTransaction = async ({
  transaction,
  userId,
  input,
}: {
  transaction: Transaction;
  userId: string;
  input: CreateMedicationInventoryAdjustmentInput;
}): Promise<MedicationInventoryAdjustmentResult> => {
  const existingInventoryEvent =
    await transaction.medicationInventoryEvent.findUnique({
      where: { id: input.entityId },
      select: {
        createdAt: true,
        medication: { select: { userId: true } },
      },
    });
  if (existingInventoryEvent) {
    throw new DoseEventServiceError(
      existingInventoryEvent.medication.userId === userId
        ? "entity_id_exists"
        : "entity_not_found",
      existingInventoryEvent.createdAt,
    );
  }
  await lockMedication(transaction, input.medicationId);
  const current = await transaction.medication.findFirst({
    where: { id: input.medicationId, userId },
    select: medicationSelection,
  });
  if (!current) throw new DoseEventServiceError("medication_not_found");
  if (new Date(input.baseVersion).getTime() !== current.updatedAt.getTime()) {
    throw new DoseEventServiceError(
      "medication_version_conflict",
      current.updatedAt,
    );
  }
  const nextQuantity = Number(current.stockQuantity ?? 0) + input.quantityDelta;
  if (nextQuantity < 0) {
    throw new DoseEventServiceError("inventory_negative");
  }
  const medication = await transaction.medication.update({
    where: { id: current.id },
    data: { stockQuantity: nextQuantity },
    select: medicationSelection,
  });
  const inventoryEvent = await transaction.medicationInventoryEvent.create({
    data: {
      id: input.entityId,
      medicationId: current.id,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      note: input.note ?? null,
      occurredAt: new Date(input.occurredAt),
    },
    select: inventoryEventSelection,
  });
  return {
    medication: toMedicationDto(medication),
    inventoryEvent: toMedicationInventoryEventDto(inventoryEvent),
  };
};

export const createMedicationInventoryAdjustment = async (
  userId: string,
  input: CreateMedicationInventoryAdjustmentInput,
): Promise<MedicationInventoryAdjustmentResult> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt) {
      if (
        receipt.entityType !== "medication_inventory_event" ||
        receipt.entityId !== input.entityId
      ) {
        throw new DoseEventServiceError("operation_id_conflict");
      }
      const inventoryEvent =
        await transaction.medicationInventoryEvent.findFirst({
          where: { id: input.entityId, medication: { userId } },
          select: inventoryEventSelection,
        });
      const medication = await transaction.medication.findFirst({
        where: { id: input.medicationId, userId },
        select: medicationSelection,
      });
      if (!inventoryEvent || !medication) {
        throw new DoseEventServiceError("operation_id_conflict");
      }
      return {
        medication: toMedicationDto(medication),
        inventoryEvent: toMedicationInventoryEventDto(inventoryEvent),
      };
    }
    const result = await adjustMedicationInventoryInTransaction({
      transaction,
      userId,
      input,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "medication_inventory_event",
        entityId: input.entityId,
        mutation: "create",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return result;
  });

export const getMedicationDetail = async (
  userId: string,
  medicationId: string,
): Promise<MedicationDetailDto> => {
  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, userId },
    select: medicationSelection,
  });
  if (!medication) throw new DoseEventServiceError("medication_not_found");
  const [events, corrections, inventoryEvents, scheduleRevisions, history] =
    await Promise.all([
      prisma.medIntake.findMany({
        where: { medicationId },
        orderBy: [{ takenAt: "desc" }, { id: "desc" }],
        take: 100,
        select: doseEventSelection,
      }),
      prisma.medicationIntakeRevision.findMany({
        where: { medicationId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
        select: correctionSelection,
      }),
      prisma.medicationInventoryEvent.findMany({
        where: { medicationId },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: 100,
        select: inventoryEventSelection,
      }),
      prisma.medicationScheduleRevision.findMany({
        where: { medicationId },
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
        take: 50,
      }),
      prisma.medicationHistory.findMany({
        where: { medicationId },
        orderBy: [{ changedAt: "desc" }, { id: "desc" }],
        take: 50,
      }),
    ]);
  const correctionCounts = new Map<string, number>();
  for (const correction of corrections) {
    correctionCounts.set(
      correction.medIntakeId,
      (correctionCounts.get(correction.medIntakeId) ?? 0) + 1,
    );
  }
  return {
    medication: toMedicationDto(medication),
    doseEvents: events.map((event) =>
      toDoseEventDto(
        event,
        event.timezone ?? "Europe/Paris",
        undefined,
        correctionCounts.get(event.id) ?? 0,
      ),
    ),
    corrections: corrections.map((correction) =>
      toDoseEventCorrectionDto(correction, { isPrn: medication.isPRN }),
    ),
    inventoryEvents: inventoryEvents.map(toMedicationInventoryEventDto),
    scheduleRevisions: scheduleRevisions.map((revision) => ({
      id: revision.id,
      effectiveDate: revision.effectiveDate,
      dosage: revision.dosage,
      frequency: revision.frequency as MedicationDto["frequency"],
      scheduleTimes: revision.scheduleTimes,
      weeklyDay: revision.weeklyDay,
      unitsPerDose: decimalToNumber(revision.unitsPerDose),
      reason: revision.reason,
      createdAt: revision.createdAt.toISOString(),
    })),
    dosageHistory: history.map((entry) => ({
      id: entry.id,
      dosage: entry.dosage,
      previousDosage: entry.previousDosage,
      reason: entry.reason,
      changedAt: entry.changedAt.toISOString(),
    })),
  };
};

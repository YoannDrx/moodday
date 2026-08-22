import type {
  CreateDoseEventInput,
  DoseEventDto,
  MedicationDto,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { getExportDateRange } from "@/features/export/date-range";
import { createScheduledDoseKey } from "@/features/medication/schedule";
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
  createdAt: true,
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

export const toDoseEventDto = (
  event: SelectedDoseEvent,
  fallbackTimezone: string,
  fallbackLocalDate?: string,
): DoseEventDto => ({
  id: event.id,
  medicationId: event.medicationId,
  operationId: event.clientOperationId,
  kind: event.skipped ? "skipped" : event.medication.isPRN ? "prn" : "taken",
  localDate:
    event.scheduledForDate ??
    fallbackLocalDate ??
    event.takenAt.toISOString().slice(0, 10),
  timezone: event.timezone ?? fallbackTimezone,
  occurredAt: event.takenAt.toISOString(),
  doseIndex: event.doseIndex,
  note: event.note,
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
  return rows.map((event) => toDoseEventDto(event, timezone, localDate));
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

import {
  createAppointmentDecisionSchema,
  createAppointmentEventSchema,
  createAppointmentQuestionSchema,
  appointmentWriteSchema,
  createCheckInSchema,
  createDoseEventCorrectionSchema,
  createDoseEventSchema,
  createMedicationInventoryAdjustmentSchema,
  createMedicationSchema,
  routineOccurrenceWriteSchema,
  routineWriteSchema,
  syncedPreferencesWriteSchema,
  updateMedicationSchema,
  userDraftWriteSchema,
  type SyncOperationResult,
  type SyncPullResult,
  type SyncPushInput,
  type SyncPushOperation,
  type SyncPushResult,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  appointmentDecisionSelection,
  appointmentEventSelection,
  appointmentQuestionSelection,
  toAppointmentDecisionDto,
  toAppointmentEventDto,
  toAppointmentQuestionDto,
} from "../appointments/artifact-service";
import {
  appointmentSelection,
  toAppointmentDto,
} from "../appointments/service";
import { checkInSelection, toCheckInDto } from "../check-ins/service";
import {
  adjustMedicationInventoryInTransaction,
  correctionSelection,
  correctDoseEventInTransaction,
  createDoseEventInTransaction,
  createMedicationInTransaction,
  doseEventSelection,
  DoseEventServiceError,
  inventoryEventSelection,
  medicationSelection,
  toDoseEventDto,
  toDoseEventCorrectionDto,
  toMedicationDto,
  toMedicationInventoryEventDto,
  updateMedicationInTransaction,
} from "../medications/service";
import { routineSelection, toRoutineDto } from "../routines/service";
import {
  assertDraftContentSize,
  syncedPreferencesSelection,
  toSyncedPreferencesDto,
  toUserDraftDto,
  userDraftSelection,
} from "../preferences-drafts/service";
import {
  routineOccurrenceSelection,
  toRoutineOccurrenceDto,
} from "../routines/occurrence-service";
import { decodeSyncCursor, encodeSyncCursor } from "./cursor";
import { createPayloadDigest } from "./digest";

type Transaction = Prisma.TransactionClient;

export class InvalidSyncCursorError extends Error {
  constructor() {
    super("The synchronization cursor is invalid");
    this.name = "InvalidSyncCursorError";
  }
}

const getPayloadObject = (operation: SyncPushOperation) =>
  operation.payload && typeof operation.payload === "object"
    ? operation.payload
    : {};

const recordOperation = async ({
  transaction,
  userId,
  deviceId,
  operation,
  status,
}: {
  transaction: Transaction;
  userId: string;
  deviceId: string;
  operation: SyncPushOperation;
  status: "applied" | "conflict" | "rejected";
}) =>
  transaction.syncOperation.create({
    data: {
      userId,
      deviceId,
      operationId: operation.operationId,
      entityType: operation.entityType,
      entityId: operation.entityId,
      mutation: operation.mutation,
      status,
      payloadDigest: createPayloadDigest(operation.payload),
      appliedAt: status === "applied" ? new Date() : null,
    },
  });

const rejected = (
  operation: SyncPushOperation,
  code: string,
): SyncOperationResult => ({
  operationId: operation.operationId,
  entityId: operation.entityId,
  status: "rejected",
  code,
  currentVersion: null,
});

const conflict = (
  operation: SyncPushOperation,
  code: string,
  currentVersion: Date | null,
): SyncOperationResult => ({
  operationId: operation.operationId,
  entityId: operation.entityId,
  status: "conflict",
  code,
  currentVersion: currentVersion?.toISOString() ?? null,
});

const applied = (
  operation: SyncPushOperation,
  currentVersion: Date,
): SyncOperationResult => ({
  operationId: operation.operationId,
  entityId: operation.entityId,
  status: "applied",
  code: null,
  currentVersion: currentVersion.toISOString(),
});

const applyCheckIn = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation !== "create") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "append_only_entity");
  }
  const parsed = createCheckInSchema.safeParse({
    ...getPayloadObject(operation),
    operationId: operation.operationId,
  });
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_check_in");
  }
  const entityExists = await transaction.checkIn.findUnique({
    where: { id: operation.entityId },
    select: { userId: true, updatedAt: true },
  });
  if (entityExists) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: entityExists.userId === userId ? "conflict" : "rejected",
    });
    return entityExists.userId === userId
      ? conflict(operation, "entity_id_exists", entityExists.updatedAt)
      : rejected(operation, "entity_not_found");
  }
  const checkIn = await transaction.checkIn.create({
    data: {
      id: operation.entityId,
      userId,
      operationId: operation.operationId,
      depth: parsed.data.depth,
      localDate: parsed.data.localDate,
      timezone: parsed.data.timezone,
      valence: parsed.data.valence ?? null,
      activation: parsed.data.activation ?? null,
      irritability: parsed.data.irritability ?? null,
      anxiety: parsed.data.anxiety ?? null,
      contexts: parsed.data.contexts,
      note: parsed.data.note ?? null,
    },
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, checkIn.updatedAt);
};

const hasCurrentVersion = (operation: SyncPushOperation, updatedAt: Date) =>
  operation.baseVersion !== undefined &&
  operation.baseVersion !== null &&
  new Date(operation.baseVersion).getTime() === updatedAt.getTime();

const applyRoutine = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  const current = await transaction.routine.findUnique({
    where: { id: operation.entityId },
    select: { userId: true, updatedAt: true },
  });
  if (current && current.userId !== userId) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }
  if (operation.mutation === "create") {
    if (current) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(operation, "entity_id_exists", current.updatedAt);
    }
    const parsed = routineWriteSchema.safeParse(operation.payload);
    if (!parsed.success) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "invalid_routine");
    }
    const routine = await transaction.routine.create({
      data: {
        id: operation.entityId,
        userId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        schedule: (parsed.data.schedule ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        weeklyTarget: parsed.data.weeklyTarget ?? null,
        status: parsed.data.status,
      },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, routine.updatedAt);
  }
  if (!current) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }
  if (!hasCurrentVersion(operation, current.updatedAt)) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "conflict",
    });
    return conflict(operation, "version_conflict", current.updatedAt);
  }
  if (operation.mutation === "delete") {
    const routine = await transaction.routine.update({
      where: { id: operation.entityId },
      data: { status: "archived", pausedAt: null },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, routine.updatedAt);
  }
  const parsed = routineWriteSchema.safeParse(operation.payload);
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_routine");
  }
  const routine = await transaction.routine.update({
    where: { id: operation.entityId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      schedule: (parsed.data.schedule ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      weeklyTarget: parsed.data.weeklyTarget ?? null,
      status: parsed.data.status,
      pausedAt: parsed.data.status === "paused" ? new Date() : null,
    },
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, routine.updatedAt);
};

const applyRoutineOccurrence = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  const current = await transaction.routineOccurrence.findUnique({
    where: { id: operation.entityId },
    select: {
      routineId: true,
      localDate: true,
      updatedAt: true,
      routine: { select: { userId: true } },
    },
  });
  if (current && current.routine.userId !== userId) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }

  if (operation.mutation === "create") {
    if (current) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(operation, "entity_id_exists", current.updatedAt);
    }
    const parsed = routineOccurrenceWriteSchema.safeParse(operation.payload);
    if (!parsed.success) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "invalid_routine_occurrence");
    }
    const routine = await transaction.routine.findFirst({
      where: {
        id: parsed.data.routineId,
        userId,
        status: { not: "archived" },
      },
      select: { id: true },
    });
    if (!routine) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "entity_not_found");
    }
    const sameDay = await transaction.routineOccurrence.findUnique({
      where: {
        routineId_localDate: {
          routineId: routine.id,
          localDate: parsed.data.localDate,
        },
      },
      select: { updatedAt: true },
    });
    if (sameDay) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(operation, "daily_occurrence_exists", sameDay.updatedAt);
    }
    const occurrence = await transaction.routineOccurrence.create({
      data: {
        id: operation.entityId,
        routineId: routine.id,
        operationId: operation.operationId,
        localDate: parsed.data.localDate,
        timezone: parsed.data.timezone,
        status: parsed.data.status,
        completedAt: parsed.data.completedAt
          ? new Date(parsed.data.completedAt)
          : null,
        note: parsed.data.note ?? null,
      },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, occurrence.updatedAt);
  }

  if (!current) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }
  if (!hasCurrentVersion(operation, current.updatedAt)) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "conflict",
    });
    return conflict(operation, "version_conflict", current.updatedAt);
  }
  if (operation.mutation === "delete") {
    const occurrence = await transaction.routineOccurrence.update({
      where: { id: operation.entityId },
      data: { status: "cancelled", completedAt: null },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, occurrence.updatedAt);
  }

  const parsed = routineOccurrenceWriteSchema.safeParse(operation.payload);
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_routine_occurrence");
  }
  if (
    parsed.data.routineId !== current.routineId ||
    parsed.data.localDate !== current.localDate
  ) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "immutable_occurrence_identity");
  }
  const occurrence = await transaction.routineOccurrence.update({
    where: { id: operation.entityId },
    data: {
      timezone: parsed.data.timezone,
      status: parsed.data.status,
      completedAt: parsed.data.completedAt
        ? new Date(parsed.data.completedAt)
        : null,
      note: parsed.data.note ?? null,
    },
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, occurrence.updatedAt);
};

const applyAppointment = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  const current = await transaction.appointment.findUnique({
    where: { id: operation.entityId },
    select: { userId: true, updatedAt: true },
  });
  if (current && current.userId !== userId) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }
  if (operation.mutation === "create") {
    if (current) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(operation, "entity_id_exists", current.updatedAt);
    }
    const parsed = appointmentWriteSchema.safeParse(operation.payload);
    if (!parsed.success) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "invalid_appointment");
    }
    const appointment = await transaction.appointment.create({
      data: {
        id: operation.entityId,
        userId,
        operationId: operation.operationId,
        clinicianId: parsed.data.clinicianId ?? null,
        title: parsed.data.title,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
        timezone: parsed.data.timezone,
        location: parsed.data.location ?? null,
        status: parsed.data.status,
        source: parsed.data.source,
        preparationStatus: parsed.data.preparationStatus,
      },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, appointment.updatedAt);
  }
  if (!current) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }
  if (!hasCurrentVersion(operation, current.updatedAt)) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "conflict",
    });
    return conflict(operation, "version_conflict", current.updatedAt);
  }
  if (operation.mutation === "delete") {
    const appointment = await transaction.appointment.update({
      where: { id: operation.entityId },
      data: { status: "cancelled" },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, appointment.updatedAt);
  }
  const parsed = appointmentWriteSchema.safeParse(operation.payload);
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_appointment");
  }
  const appointment = await transaction.appointment.update({
    where: { id: operation.entityId },
    data: {
      clinicianId: parsed.data.clinicianId ?? null,
      title: parsed.data.title,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      timezone: parsed.data.timezone,
      location: parsed.data.location ?? null,
      status: parsed.data.status,
      source: parsed.data.source,
      preparationStatus: parsed.data.preparationStatus,
    },
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, appointment.updatedAt);
};

const applyAppointmentArtifact = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation !== "create") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "append_only_entity");
  }
  const payload = getPayloadObject(operation) as { appointmentId?: unknown };
  if (typeof payload.appointmentId !== "string") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_appointment_artifact");
  }
  const appointment = await transaction.appointment.findFirst({
    where: { id: payload.appointmentId, userId },
    select: { id: true },
  });
  if (!appointment) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }

  if (operation.entityType === "appointment_question") {
    const parsed = createAppointmentQuestionSchema.safeParse({
      ...payload,
      operationId: operation.operationId,
      questionId: operation.entityId,
    });
    if (!parsed.success) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "invalid_appointment_question");
    }
    const entityExists = await transaction.appointmentQuestion.findUnique({
      where: { id: operation.entityId },
      select: { appointment: { select: { userId: true } }, updatedAt: true },
    });
    if (entityExists) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status:
          entityExists.appointment.userId === userId ? "conflict" : "rejected",
      });
      return entityExists.appointment.userId === userId
        ? conflict(operation, "entity_id_exists", entityExists.updatedAt)
        : rejected(operation, "entity_not_found");
    }
    const positions = await transaction.appointmentQuestion.aggregate({
      where: { appointmentId: appointment.id },
      _max: { position: true },
    });
    const question = await transaction.appointmentQuestion.create({
      data: {
        id: operation.entityId,
        appointmentId: appointment.id,
        operationId: operation.operationId,
        position: parsed.data.position ?? (positions._max.position ?? -1) + 1,
        content: parsed.data.content,
        privateNote: parsed.data.privateNote,
      },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, question.updatedAt);
  }

  if (operation.entityType === "appointment_event") {
    const parsed = createAppointmentEventSchema.safeParse({
      ...payload,
      operationId: operation.operationId,
      eventId: operation.entityId,
    });
    if (!parsed.success) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "invalid_appointment_event");
    }
    const entityExists = await transaction.appointmentEvent.findUnique({
      where: { id: operation.entityId },
      select: { appointment: { select: { userId: true } }, createdAt: true },
    });
    if (entityExists) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status:
          entityExists.appointment.userId === userId ? "conflict" : "rejected",
      });
      return entityExists.appointment.userId === userId
        ? conflict(operation, "entity_id_exists", entityExists.createdAt)
        : rejected(operation, "entity_not_found");
    }
    const event = await transaction.appointmentEvent.create({
      data: {
        id: operation.entityId,
        appointmentId: appointment.id,
        operationId: operation.operationId,
        type: parsed.data.type,
        occurredAt: new Date(parsed.data.occurredAt),
        payload: (parsed.data.payload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
      select: { createdAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, event.createdAt);
  }

  const parsed = createAppointmentDecisionSchema.safeParse({
    ...payload,
    operationId: operation.operationId,
    decisionId: operation.entityId,
  });
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_appointment_decision");
  }
  const entityExists = await transaction.appointmentDecision.findUnique({
    where: { id: operation.entityId },
    select: { appointment: { select: { userId: true } }, updatedAt: true },
  });
  if (entityExists) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status:
        entityExists.appointment.userId === userId ? "conflict" : "rejected",
    });
    return entityExists.appointment.userId === userId
      ? conflict(operation, "entity_id_exists", entityExists.updatedAt)
      : rejected(operation, "entity_not_found");
  }
  const decision = await transaction.appointmentDecision.create({
    data: {
      id: operation.entityId,
      appointmentId: appointment.id,
      operationId: operation.operationId,
      summary: parsed.data.summary,
      status: parsed.data.status,
      includeInBrief: parsed.data.includeInBrief,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      completedAt: parsed.data.status === "completed" ? new Date() : null,
    },
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, decision.updatedAt);
};

const applyDoseEvent = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation !== "create") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "append_only_entity");
  }
  const parsed = createDoseEventSchema.safeParse({
    ...getPayloadObject(operation),
    operationId: operation.operationId,
    entityId: operation.entityId,
  });
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_dose_event");
  }

  try {
    const event = await createDoseEventInTransaction({
      transaction,
      userId,
      input: parsed.data,
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, event.createdAt);
  } catch (error) {
    if (!(error instanceof DoseEventServiceError)) throw error;
    const isConflict = ["entity_id_exists", "scheduled_dose_exists"].includes(
      error.code,
    );
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: isConflict ? "conflict" : "rejected",
    });
    return isConflict
      ? conflict(operation, error.code, error.currentVersion)
      : rejected(operation, error.code);
  }
};

const applyMedication = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation === "delete") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "unsupported_medication_mutation");
  }
  try {
    const payload = getPayloadObject(operation) as Record<string, unknown>;
    let medication;
    if (operation.mutation === "create") {
      const parsed = createMedicationSchema.safeParse({
        ...payload,
        operationId: operation.operationId,
        entityId: operation.entityId,
      });
      if (!parsed.success) {
        await recordOperation({
          transaction,
          userId,
          deviceId,
          operation,
          status: "rejected",
        });
        return rejected(operation, "invalid_medication");
      }
      medication = await createMedicationInTransaction({
        transaction,
        userId,
        input: parsed.data,
      });
    } else {
      const parsed = updateMedicationSchema.safeParse({
        ...payload,
        operationId: operation.operationId,
        medicationId: operation.entityId,
        baseVersion: operation.baseVersion ?? payload.baseVersion,
      });
      if (!parsed.success) {
        await recordOperation({
          transaction,
          userId,
          deviceId,
          operation,
          status: "rejected",
        });
        return rejected(operation, "invalid_medication");
      }
      medication = await updateMedicationInTransaction({
        transaction,
        userId,
        input: parsed.data,
      });
    }
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, medication.updatedAt);
  } catch (error) {
    if (!(error instanceof DoseEventServiceError)) throw error;
    const isConflict = [
      "entity_id_exists",
      "medication_version_conflict",
    ].includes(error.code);
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: isConflict ? "conflict" : "rejected",
    });
    return isConflict
      ? conflict(operation, error.code, error.currentVersion)
      : rejected(operation, error.code);
  }
};

const applyDoseEventCorrection = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation !== "create") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "append_only_entity");
  }
  const parsed = createDoseEventCorrectionSchema.safeParse({
    ...getPayloadObject(operation),
    operationId: operation.operationId,
    entityId: operation.entityId,
  });
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_dose_event_correction");
  }
  try {
    const result = await correctDoseEventInTransaction({
      transaction,
      userId,
      input: parsed.data,
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, new Date(result.event.updatedAt));
  } catch (error) {
    if (!(error instanceof DoseEventServiceError)) throw error;
    const isConflict = [
      "entity_id_exists",
      "operation_id_conflict",
      "dose_version_conflict",
    ].includes(error.code);
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: isConflict ? "conflict" : "rejected",
    });
    return isConflict
      ? conflict(operation, error.code, error.currentVersion)
      : rejected(operation, error.code);
  }
};

const applyMedicationInventoryEvent = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation !== "create") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "append_only_entity");
  }
  const parsed = createMedicationInventoryAdjustmentSchema.safeParse({
    ...getPayloadObject(operation),
    operationId: operation.operationId,
    entityId: operation.entityId,
  });
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_inventory_adjustment");
  }
  try {
    const result = await adjustMedicationInventoryInTransaction({
      transaction,
      userId,
      input: parsed.data,
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, new Date(result.medication.updatedAt));
  } catch (error) {
    if (!(error instanceof DoseEventServiceError)) throw error;
    const isConflict = [
      "entity_id_exists",
      "operation_id_conflict",
      "medication_version_conflict",
    ].includes(error.code);
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: isConflict ? "conflict" : "rejected",
    });
    return isConflict
      ? conflict(operation, error.code, error.currentVersion)
      : rejected(operation, error.code);
  }
};

const applyUserDraft = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  const current = await transaction.userDraft.findUnique({
    where: { id: operation.entityId },
    select: { userId: true, updatedAt: true },
  });
  if (current && current.userId !== userId) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }

  if (operation.mutation === "delete") {
    if (!current) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "rejected",
      });
      return rejected(operation, "entity_not_found");
    }
    if (!hasCurrentVersion(operation, current.updatedAt)) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(operation, "version_conflict", current.updatedAt);
    }
    await transaction.userDraft.delete({ where: { id: operation.entityId } });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, new Date());
  }

  const parsed = userDraftWriteSchema.safeParse(operation.payload);
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_user_draft");
  }
  try {
    assertDraftContentSize(parsed.data.content);
  } catch {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "draft_content_too_large");
  }

  if (operation.mutation === "create") {
    const existingContext = await transaction.userDraft.findUnique({
      where: {
        userId_kind_contextKey: {
          userId,
          kind: parsed.data.kind,
          contextKey: parsed.data.contextKey,
        },
      },
      select: { id: true, updatedAt: true },
    });
    if (current || existingContext) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(
        operation,
        "draft_context_exists",
        current?.updatedAt ?? existingContext?.updatedAt ?? null,
      );
    }
    const created = await transaction.userDraft.create({
      data: {
        id: operation.entityId,
        userId,
        kind: parsed.data.kind,
        contextKey: parsed.data.contextKey,
        content: parsed.data.content as Prisma.InputJsonValue,
      },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, created.updatedAt);
  }

  if (!current) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "entity_not_found");
  }
  if (!hasCurrentVersion(operation, current.updatedAt)) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "conflict",
    });
    return conflict(operation, "version_conflict", current.updatedAt);
  }
  const updated = await transaction.userDraft.update({
    where: { id: operation.entityId },
    data: {
      kind: parsed.data.kind,
      contextKey: parsed.data.contextKey,
      content: parsed.data.content as Prisma.InputJsonValue,
    },
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, updated.updatedAt);
};

const applyUserPreferences = async (
  transaction: Transaction,
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> => {
  if (operation.mutation === "delete") {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "preferences_cannot_be_deleted");
  }
  const parsed = syncedPreferencesWriteSchema.safeParse(operation.payload);
  if (!parsed.success) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "rejected",
    });
    return rejected(operation, "invalid_user_preferences");
  }
  const current = await transaction.userPreferences.findUnique({
    where: { userId },
    select: { id: true, updatedAt: true },
  });
  if (operation.mutation === "create") {
    if (current) {
      await recordOperation({
        transaction,
        userId,
        deviceId,
        operation,
        status: "conflict",
      });
      return conflict(operation, "preferences_exist", current.updatedAt);
    }
    const created = await transaction.userPreferences.create({
      data: { id: operation.entityId, userId, ...parsed.data },
      select: { updatedAt: true },
    });
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "applied",
    });
    return applied(operation, created.updatedAt);
  }
  if (!current || current.id !== operation.entityId) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: current ? "conflict" : "rejected",
    });
    return current
      ? conflict(operation, "preferences_entity_mismatch", current.updatedAt)
      : rejected(operation, "entity_not_found");
  }
  if (!hasCurrentVersion(operation, current.updatedAt)) {
    await recordOperation({
      transaction,
      userId,
      deviceId,
      operation,
      status: "conflict",
    });
    return conflict(operation, "version_conflict", current.updatedAt);
  }
  const updated = await transaction.userPreferences.update({
    where: { id: current.id },
    data: parsed.data,
    select: { updatedAt: true },
  });
  await recordOperation({
    transaction,
    userId,
    deviceId,
    operation,
    status: "applied",
  });
  return applied(operation, updated.updatedAt);
};

const applyOperation = async (
  userId: string,
  deviceId: string,
  operation: SyncPushOperation,
): Promise<SyncOperationResult> =>
  prisma.$transaction(async (transaction) => {
    const existing = await transaction.syncOperation.findUnique({
      where: {
        userId_operationId: { userId, operationId: operation.operationId },
      },
      select: { status: true, entityId: true },
    });
    if (existing) {
      return {
        operationId: operation.operationId,
        entityId: existing.entityId ?? operation.entityId,
        status: existing.status === "applied" ? "duplicate" : existing.status,
        code:
          existing.status === "applied" ? null : `previous_${existing.status}`,
        currentVersion: null,
      };
    }

    if (operation.entityType === "check_in") {
      return applyCheckIn(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "medication") {
      return applyMedication(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "dose_event") {
      return applyDoseEvent(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "dose_event_correction") {
      return applyDoseEventCorrection(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "medication_inventory_event") {
      return applyMedicationInventoryEvent(
        transaction,
        userId,
        deviceId,
        operation,
      );
    }
    if (operation.entityType === "user_draft") {
      return applyUserDraft(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "user_preferences") {
      return applyUserPreferences(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "routine") {
      return applyRoutine(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "routine_occurrence") {
      return applyRoutineOccurrence(transaction, userId, deviceId, operation);
    }
    if (operation.entityType === "appointment") {
      return applyAppointment(transaction, userId, deviceId, operation);
    }
    return applyAppointmentArtifact(transaction, userId, deviceId, operation);
  });

export const pushSyncOperations = async (
  userId: string,
  input: SyncPushInput,
): Promise<SyncPushResult> => {
  const device = await prisma.device.upsert({
    where: { userId_publicId: { userId, publicId: input.deviceId } },
    update: { lastSeenAt: new Date() },
    create: {
      userId,
      publicId: input.deviceId,
      platform: input.platform,
      lastSeenAt: new Date(),
    },
    select: { id: true, revokedAt: true },
  });
  if (device.revokedAt) throw new Error("Device access has been revoked");

  const applyAt = async (index: number): Promise<SyncOperationResult[]> => {
    const operation = input.operations.at(index);
    if (!operation) return [];
    const result = await applyOperation(userId, device.id, operation);
    return [result, ...(await applyAt(index + 1))];
  };

  return { results: await applyAt(0) };
};

const hydrateChange = async (
  userId: string,
  operation: {
    operationId: string;
    entityId: string | null;
    entityType: string;
    mutation: "create" | "update" | "delete";
    createdAt: Date;
  },
) => {
  if (!operation.entityId || operation.mutation === "delete") {
    return { data: null };
  }
  if (operation.entityType === "check_in") {
    const value = await prisma.checkIn.findFirst({
      where: { id: operation.entityId, userId },
      select: checkInSelection,
    });
    return { data: value ? toCheckInDto(value) : null };
  }
  if (operation.entityType === "medication") {
    const value = await prisma.medication.findFirst({
      where: { id: operation.entityId, userId },
      select: medicationSelection,
    });
    return { data: value ? toMedicationDto(value) : null };
  }
  if (operation.entityType === "dose_event") {
    const value = await prisma.medIntake.findFirst({
      where: { id: operation.entityId, medication: { userId } },
      select: doseEventSelection,
    });
    return {
      data: value
        ? toDoseEventDto(value, value.timezone ?? "Europe/Paris")
        : null,
    };
  }
  if (operation.entityType === "dose_event_correction") {
    const correction = await prisma.medicationIntakeRevision.findFirst({
      where: { id: operation.entityId, actorId: userId },
      select: correctionSelection,
    });
    if (!correction) return { data: null };
    const event = await prisma.medIntake.findFirst({
      where: { id: correction.medIntakeId, medication: { userId } },
      select: doseEventSelection,
    });
    if (!event) return { data: null };
    const correctionCount = await prisma.medicationIntakeRevision.count({
      where: { medIntakeId: event.id },
    });
    return {
      data: {
        event: toDoseEventDto(
          event,
          event.timezone ?? "Europe/Paris",
          undefined,
          correctionCount,
        ),
        correction: toDoseEventCorrectionDto(correction, {
          isPrn: event.medication.isPRN,
        }),
      },
    };
  }
  if (operation.entityType === "medication_inventory_event") {
    const inventoryEvent = await prisma.medicationInventoryEvent.findFirst({
      where: { id: operation.entityId, medication: { userId } },
      select: inventoryEventSelection,
    });
    if (!inventoryEvent) return { data: null };
    const medication = await prisma.medication.findFirst({
      where: { id: inventoryEvent.medicationId, userId },
      select: medicationSelection,
    });
    return {
      data: medication
        ? {
            medication: toMedicationDto(medication),
            inventoryEvent: toMedicationInventoryEventDto(inventoryEvent),
          }
        : null,
    };
  }
  if (operation.entityType === "user_draft") {
    const value = await prisma.userDraft.findFirst({
      where: { id: operation.entityId, userId },
      select: userDraftSelection,
    });
    return { data: value ? toUserDraftDto(value) : null };
  }
  if (operation.entityType === "user_preferences") {
    const value = await prisma.userPreferences.findUnique({
      where: { userId },
      select: syncedPreferencesSelection,
    });
    return { data: value ? toSyncedPreferencesDto(value) : null };
  }
  if (operation.entityType === "routine") {
    const value = await prisma.routine.findFirst({
      where: { id: operation.entityId, userId },
      select: routineSelection,
    });
    return { data: value ? toRoutineDto(value) : null };
  }
  if (operation.entityType === "routine_occurrence") {
    const value = await prisma.routineOccurrence.findFirst({
      where: { id: operation.entityId, routine: { userId } },
      select: routineOccurrenceSelection,
    });
    return { data: value ? toRoutineOccurrenceDto(value) : null };
  }
  if (operation.entityType === "appointment") {
    const value = await prisma.appointment.findFirst({
      where: { id: operation.entityId, userId },
      select: appointmentSelection,
    });
    return { data: value ? toAppointmentDto(value) : null };
  }
  if (operation.entityType === "appointment_question") {
    const value = await prisma.appointmentQuestion.findFirst({
      where: { id: operation.entityId, appointment: { userId } },
      select: appointmentQuestionSelection,
    });
    return { data: value ? toAppointmentQuestionDto(value) : null };
  }
  if (operation.entityType === "appointment_event") {
    const value = await prisma.appointmentEvent.findFirst({
      where: { id: operation.entityId, appointment: { userId } },
      select: appointmentEventSelection,
    });
    return { data: value ? toAppointmentEventDto(value) : null };
  }
  if (operation.entityType === "appointment_decision") {
    const value = await prisma.appointmentDecision.findFirst({
      where: { id: operation.entityId, appointment: { userId } },
      select: appointmentDecisionSelection,
    });
    return { data: value ? toAppointmentDecisionDto(value) : null };
  }
  return { data: null };
};

export const pullSyncChanges = async ({
  userId,
  cursor,
  limit,
}: {
  userId: string;
  cursor?: string;
  limit: number;
}): Promise<SyncPullResult> => {
  const decoded = cursor ? decodeSyncCursor(cursor) : null;
  if (cursor && !decoded) throw new InvalidSyncCursorError();
  const rows = await prisma.syncOperation.findMany({
    where: {
      userId,
      status: "applied",
      ...(decoded
        ? {
            OR: [
              { createdAt: { gt: new Date(decoded.changedAt) } },
              {
                createdAt: new Date(decoded.changedAt),
                id: { gt: decoded.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    select: {
      id: true,
      operationId: true,
      entityId: true,
      entityType: true,
      mutation: true,
      createdAt: true,
    },
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const changes = await Promise.all(
    page.map(async (operation) => {
      const hydrated = await hydrateChange(userId, operation);
      return {
        operationId: operation.operationId,
        entityId: operation.entityId,
        entityType:
          operation.entityType as SyncPullResult["changes"][number]["entityType"],
        mutation: operation.mutation,
        changedAt: operation.createdAt.toISOString(),
        data: hydrated.data,
      };
    }),
  );
  const last = page.at(-1);
  return {
    changes,
    nextCursor: last
      ? encodeSyncCursor({
          changedAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : (cursor ?? null),
    hasMore,
  };
};

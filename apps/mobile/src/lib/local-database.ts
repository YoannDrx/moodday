import {
  createAppointmentDecisionSchema,
  createAppointmentEventSchema,
  createAppointmentQuestionSchema,
  appointmentWriteSchema,
  createCheckInSchema,
  doseEventCorrectionWriteSchema,
  doseEventWriteSchema,
  medicationInventoryAdjustmentWriteSchema,
  medicationWriteSchema,
  routineOccurrenceWriteSchema,
  routineWriteSchema,
  type AppointmentDto,
  type AppointmentDecisionDto,
  type AppointmentEventDto,
  type AppointmentQuestionDto,
  type AppointmentWriteInput,
  type CreateAppointmentDecisionInput,
  type CreateAppointmentEventInput,
  type CreateAppointmentQuestionInput,
  type CreateCheckInInput,
  type DoseEventDto,
  type DoseEventCorrectionResult,
  type DoseEventCorrectionWriteInput,
  type DoseEventWriteInput,
  type MedicationDetailDto,
  type MedicationDto,
  type MedicationInventoryAdjustmentResult,
  type MedicationInventoryAdjustmentWriteInput,
  type MedicationWriteInput,
  type RoutineDto,
  type RoutineOccurrenceDto,
  type RoutineOccurrenceWriteInput,
  type RoutineWriteInput,
  type SafetyPlanDto,
  type SyncEntityType,
  type SyncPushOperation,
} from "@moodday/contracts";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { api } from "./api";
import {
  createLocalOperationSummary,
  createOwnerStorageIdentity,
  normalizeLocalOwnerId,
  persistOperationBeforeSync,
} from "./local-database-core";

const DEVICE_ID_REFERENCE = "moodday.device-id.v1";
const SYNC_CURSOR_KEY = "server-cursor";

type PendingRow = {
  operation_id: string;
  entity_id: string;
  entity_type: SyncEntityType;
  mutation: "create" | "update" | "delete";
  base_version: string | null;
  payload: string;
};

type SnapshotRow = { payload: string };
type SnapshotEntityType = SyncEntityType;

type OperationCountRow = {
  state: "pending" | "conflict" | "rejected";
  count: number;
};

const databasePromises = new Map<string, Promise<SQLite.SQLiteDatabase>>();

const createDatabaseKey = async () => {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

const getOwnerStorageIdentity = async (ownerId: string) => {
  const normalizedOwnerId = normalizeLocalOwnerId(ownerId);
  const ownerHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalizedOwnerId,
  );
  return createOwnerStorageIdentity(ownerHash);
};

const getDatabaseKey = async (keyReference: string) => {
  const existing = await SecureStore.getItemAsync(keyReference);
  if (existing) return existing;
  const key = await createDatabaseKey();
  await SecureStore.setItemAsync(keyReference, key, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return key;
};

const getDeviceId = async () => {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_REFERENCE);
  if (existing) return existing;
  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_REFERENCE, deviceId, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return deviceId;
};

const initializeDatabase = async ({
  databaseName,
  keyReference,
}: {
  databaseName: string;
  keyReference: string;
}) => {
  const key = await getDatabaseKey(keyReference);
  const database = await SQLite.openDatabaseAsync(databaseName);

  // The generated key is hexadecimal only and never leaves SecureStore.
  await database.execAsync(`PRAGMA key = "x'${key}'";`);
  const cipher = await database.getFirstAsync<{ cipher_version: string }>(
    "PRAGMA cipher_version",
  );
  if (!cipher?.cipher_version) {
    await database.closeAsync();
    throw new Error("sqlcipher_unavailable");
  }
  await database.execAsync(`
    PRAGMA cipher_memory_security = ON;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS pending_sync_operation (
      operation_id TEXT PRIMARY KEY NOT NULL,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'medication', 'dose_event', 'dose_event_correction', 'medication_inventory_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
      mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
      base_version TEXT,
      payload TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
      error_code TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS pending_sync_operation_state_created_at_idx
      ON pending_sync_operation(state, created_at);
    CREATE TABLE IF NOT EXISTS sync_snapshot (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload TEXT,
      changed_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (entity_type, entity_id)
    );
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS health_raw_sample (
      sample_type TEXT NOT NULL,
      sample_id TEXT NOT NULL,
      local_date TEXT NOT NULL,
      payload TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      PRIMARY KEY (sample_type, sample_id)
    );
    CREATE INDEX IF NOT EXISTS health_raw_sample_local_date_idx
      ON health_raw_sample(local_date, sample_type);
    CREATE TABLE IF NOT EXISTS safety_plan_snapshot (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      payload TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS medication_detail_snapshot (
      medication_id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  `);
  const schemaVersion = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  if ((schemaVersion?.user_version ?? 0) < 2) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE pending_sync_operation_v2 (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'dose_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
          mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
          error_code TEXT,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO pending_sync_operation_v2
          (operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at)
        SELECT operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at
        FROM pending_sync_operation;
        DROP TABLE pending_sync_operation;
        ALTER TABLE pending_sync_operation_v2 RENAME TO pending_sync_operation;
        CREATE INDEX pending_sync_operation_state_created_at_idx
          ON pending_sync_operation(state, created_at);
        PRAGMA user_version = 2;
      `);
    });
  }
  if ((schemaVersion?.user_version ?? 0) < 3) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE pending_sync_operation_v3 (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'dose_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
          mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
          error_code TEXT,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO pending_sync_operation_v3
          (operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at)
        SELECT operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at
        FROM pending_sync_operation;
        DROP TABLE pending_sync_operation;
        ALTER TABLE pending_sync_operation_v3 RENAME TO pending_sync_operation;
        CREATE INDEX pending_sync_operation_state_created_at_idx
          ON pending_sync_operation(state, created_at);
        PRAGMA user_version = 3;
      `);
    });
  }
  if ((schemaVersion?.user_version ?? 0) < 4) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE pending_sync_operation_v4 (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'dose_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
          mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
          error_code TEXT,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO pending_sync_operation_v4
          (operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at)
        SELECT operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at
        FROM pending_sync_operation;
        DROP TABLE pending_sync_operation;
        ALTER TABLE pending_sync_operation_v4 RENAME TO pending_sync_operation;
        CREATE INDEX pending_sync_operation_state_created_at_idx
          ON pending_sync_operation(state, created_at);
        PRAGMA user_version = 4;
      `);
    });
  }
  if ((schemaVersion?.user_version ?? 0) < 5) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS health_raw_sample (
          sample_type TEXT NOT NULL,
          sample_id TEXT NOT NULL,
          local_date TEXT NOT NULL,
          payload TEXT NOT NULL,
          observed_at TEXT NOT NULL,
          PRIMARY KEY (sample_type, sample_id)
        );
        CREATE INDEX IF NOT EXISTS health_raw_sample_local_date_idx
          ON health_raw_sample(local_date, sample_type);
        PRAGMA user_version = 5;
      `);
    });
  }
  if ((schemaVersion?.user_version ?? 0) < 6) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS safety_plan_snapshot (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          payload TEXT NOT NULL,
          cached_at TEXT NOT NULL
        );
        PRAGMA user_version = 6;
      `);
    });
  }
  if ((schemaVersion?.user_version ?? 0) < 7) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE pending_sync_operation_v7 (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'dose_event', 'dose_event_correction', 'medication_inventory_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
          mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
          error_code TEXT,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO pending_sync_operation_v7
          (operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at)
        SELECT operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at
        FROM pending_sync_operation;
        DROP TABLE pending_sync_operation;
        ALTER TABLE pending_sync_operation_v7 RENAME TO pending_sync_operation;
        CREATE INDEX pending_sync_operation_state_created_at_idx
          ON pending_sync_operation(state, created_at);
        CREATE TABLE IF NOT EXISTS medication_detail_snapshot (
          medication_id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          cached_at TEXT NOT NULL
        );
        PRAGMA user_version = 7;
      `);
    });
  }
  if ((schemaVersion?.user_version ?? 0) < 8) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE pending_sync_operation_v8 (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'medication', 'dose_event', 'dose_event_correction', 'medication_inventory_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
          mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
          error_code TEXT,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO pending_sync_operation_v8
          (operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at)
        SELECT operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at
        FROM pending_sync_operation;
        DROP TABLE pending_sync_operation;
        ALTER TABLE pending_sync_operation_v8 RENAME TO pending_sync_operation;
        CREATE INDEX pending_sync_operation_state_created_at_idx
          ON pending_sync_operation(state, created_at);
        PRAGMA user_version = 8;
      `);
    });
  }
  return database;
};

export const getLocalDatabase = async (ownerId: string) => {
  const identity = await getOwnerStorageIdentity(ownerId);
  const existing = databasePromises.get(identity.databaseName);
  if (existing) return existing;

  const databasePromise = initializeDatabase(identity).catch((error) => {
    databasePromises.delete(identity.databaseName);
    throw error;
  });
  databasePromises.set(identity.databaseName, databasePromise);
  return databasePromise;
};

export const closeOwnerLocalDatabase = async (ownerId: string) => {
  const identity = await getOwnerStorageIdentity(ownerId);
  const databasePromise = databasePromises.get(identity.databaseName);
  databasePromises.delete(identity.databaseName);
  if (!databasePromise) return;

  const database = await databasePromise;
  await database.closeAsync();
};

export const purgeOwnerLocalData = async (ownerId: string) => {
  const identity = await getOwnerStorageIdentity(ownerId);
  await closeOwnerLocalDatabase(ownerId);
  await SQLite.deleteDatabaseAsync(identity.databaseName);
  await SecureStore.deleteItemAsync(identity.keyReference);
};

const queueOperation = async (
  ownerId: string,
  operation: SyncPushOperation,
  optimisticSnapshot?: unknown,
) => {
  const database = await getLocalDatabase(ownerId);
  const createdAt = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT OR IGNORE INTO pending_sync_operation
        (operation_id, entity_id, entity_type, mutation, base_version, payload, state, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      operation.operationId,
      operation.entityId,
      operation.entityType,
      operation.mutation,
      operation.baseVersion ?? null,
      JSON.stringify(operation.payload),
      createdAt,
    );
    if (optimisticSnapshot !== undefined) {
      await database.runAsync(
        `INSERT INTO sync_snapshot (entity_type, entity_id, payload, changed_at, deleted)
         VALUES (?, ?, ?, ?, 0)
         ON CONFLICT(entity_type, entity_id) DO UPDATE SET
           payload = excluded.payload,
           changed_at = excluded.changed_at,
           deleted = 0`,
        operation.entityType,
        operation.entityId,
        JSON.stringify(optimisticSnapshot),
        createdAt,
      );
    }
  });
};

const pushOperations = async (operations: SyncPushOperation[]) =>
  api.pushSync({
    deviceId: await getDeviceId(),
    platform: Platform.OS === "android" ? "android" : "ios",
    operations,
  });

const removeQueuedOperation = async (ownerId: string, operationId: string) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    "DELETE FROM pending_sync_operation WHERE operation_id = ?",
    operationId,
  );
};

const removeLocalSnapshot = async (
  ownerId: string,
  entityType: SyncEntityType,
  entityId: string,
) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    "DELETE FROM sync_snapshot WHERE entity_type = ? AND entity_id = ?",
    entityType,
    entityId,
  );
};

const restoreLocalSnapshot = async (
  ownerId: string,
  entityType: SyncEntityType,
  entityId: string,
  snapshot: unknown,
) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    `INSERT INTO sync_snapshot (entity_type, entity_id, payload, changed_at, deleted)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET
       payload = excluded.payload,
       changed_at = excluded.changed_at,
       deleted = 0`,
    entityType,
    entityId,
    JSON.stringify(snapshot),
    new Date().toISOString(),
  );
};

const saveOfflineFirst = async (
  ownerId: string,
  operation: SyncPushOperation,
  optimisticSnapshot?: unknown,
  rollbackSnapshot?: unknown,
) =>
  persistOperationBeforeSync(operation, {
    discard: async () => {
      await removeQueuedOperation(ownerId, operation.operationId);
      if (optimisticSnapshot !== undefined) {
        if (rollbackSnapshot === undefined) {
          await removeLocalSnapshot(
            ownerId,
            operation.entityType,
            operation.entityId,
          );
        } else {
          await restoreLocalSnapshot(
            ownerId,
            operation.entityType,
            operation.entityId,
            rollbackSnapshot,
          );
        }
      }
    },
    hideRejected: async () => {
      if (optimisticSnapshot !== undefined) {
        if (rollbackSnapshot === undefined) {
          await removeLocalSnapshot(
            ownerId,
            operation.entityType,
            operation.entityId,
          );
        } else {
          await restoreLocalSnapshot(
            ownerId,
            operation.entityType,
            operation.entityId,
            rollbackSnapshot,
          );
        }
      }
    },
    queue: async () => queueOperation(ownerId, operation, optimisticSnapshot),
    push: async () => pushOperations([operation]),
    remove: async () => removeQueuedOperation(ownerId, operation.operationId),
    markRejected: async (code) => {
      const database = await getLocalDatabase(ownerId);
      await database.runAsync(
        "UPDATE pending_sync_operation SET state = 'rejected', error_code = ? WHERE operation_id = ?",
        code,
        operation.operationId,
      );
    },
  });

export const getPendingOperationCount = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pending_sync_operation WHERE state = 'pending'",
  );
  return row?.count ?? 0;
};

export const getLocalOperationSummary = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const rows = await database.getAllAsync<OperationCountRow>(
    `SELECT state, COUNT(*) AS count
     FROM pending_sync_operation
     GROUP BY state`,
  );
  return createLocalOperationSummary(rows);
};

export const saveCheckInOfflineFirst = async (
  ownerId: string,
  input: CreateCheckInInput,
) => {
  const parsed = createCheckInSchema.parse(input);
  return saveOfflineFirst(ownerId, {
    operationId: parsed.operationId,
    entityId: Crypto.randomUUID(),
    entityType: "check_in",
    mutation: "create",
    payload: parsed,
  });
};

export const saveRoutineOfflineFirst = async (
  ownerId: string,
  input: RoutineWriteInput,
) => {
  const payload = routineWriteSchema.parse(input);
  return saveOfflineFirst(ownerId, {
    operationId: Crypto.randomUUID(),
    entityId: Crypto.randomUUID(),
    entityType: "routine",
    mutation: "create",
    payload,
  });
};

export const saveMedicationOfflineFirst = async (
  ownerId: string,
  input: MedicationWriteInput & { localDate: string; timezone: string },
) => {
  const { localDate, timezone, ...writeInput } = input;
  const payload = medicationWriteSchema.parse(writeInput);
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const medication: MedicationDto = {
    ...payload,
    id: entityId,
    isPrn: payload.frequency === "prn",
    isArchived: false,
    startDate: payload.startDate ?? localDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const result = await saveOfflineFirst(
    ownerId,
    {
      operationId,
      entityId,
      entityType: "medication",
      mutation: "create",
      payload: { ...payload, localDate, timezone },
    },
    medication,
  );
  return { ...result, medication };
};

export const updateMedicationOfflineFirst = async (
  ownerId: string,
  current: MedicationDto,
  input: MedicationWriteInput & {
    localDate: string;
    timezone: string;
    reason: string;
  },
) => {
  const { localDate, timezone, reason, ...writeInput } = input;
  const payload = medicationWriteSchema.parse(writeInput);
  const operationId = Crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const medication: MedicationDto = {
    ...current,
    ...payload,
    isPrn: payload.frequency === "prn",
    updatedAt: timestamp,
  };
  const result = await saveOfflineFirst(
    ownerId,
    {
      operationId,
      entityId: current.id,
      entityType: "medication",
      mutation: "update",
      baseVersion: current.updatedAt,
      payload: {
        ...payload,
        localDate,
        timezone,
        reason,
        baseVersion: current.updatedAt,
      },
    },
    medication,
    current,
  );
  return { ...result, medication };
};

export const saveDoseEventOfflineFirst = async (
  ownerId: string,
  input: DoseEventWriteInput,
) => {
  const payload = doseEventWriteSchema.parse(input);
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const event: DoseEventDto = {
    ...payload,
    id: entityId,
    operationId,
    doseIndex: payload.doseIndex ?? null,
    note: payload.note ?? null,
    cancelledAt: null,
    correctionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const result = await saveOfflineFirst(
    ownerId,
    {
      operationId,
      entityId,
      entityType: "dose_event",
      mutation: "create",
      payload,
    },
    event,
  );
  return { ...result, event };
};

export const saveDoseEventCorrectionOfflineFirst = async (
  ownerId: string,
  event: DoseEventDto,
  input: DoseEventCorrectionWriteInput,
) => {
  const payload = doseEventCorrectionWriteSchema.parse(input);
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const correctedEvent: DoseEventDto = {
    ...event,
    kind: payload.targetKind,
    occurredAt: payload.occurredAt,
    timezone: payload.timezone,
    note: payload.note ?? null,
    cancelledAt: payload.targetKind === "cancelled" ? timestamp : null,
    correctionCount: event.correctionCount + 1,
    updatedAt: timestamp,
  };
  const correction: DoseEventCorrectionResult["correction"] = {
    id: entityId,
    doseEventId: event.id,
    medicationId: event.medicationId,
    operationId,
    previousKind: event.kind,
    targetKind: payload.targetKind,
    previousOccurredAt: event.occurredAt,
    occurredAt: payload.occurredAt,
    timezone: payload.timezone,
    previousNote: event.note,
    note: payload.note ?? null,
    reason: payload.reason,
    createdAt: timestamp,
  };
  const optimistic: DoseEventCorrectionResult = {
    event: correctedEvent,
    correction,
  };
  const result = await saveOfflineFirst(
    ownerId,
    {
      operationId,
      entityId,
      entityType: "dose_event_correction",
      mutation: "create",
      payload,
    },
    optimistic,
  );
  return { ...result, ...optimistic };
};

export const saveMedicationInventoryAdjustmentOfflineFirst = async (
  ownerId: string,
  medication: MedicationDto,
  input: MedicationInventoryAdjustmentWriteInput,
) => {
  const payload = medicationInventoryAdjustmentWriteSchema.parse(input);
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const nextMedication: MedicationDto = {
    ...medication,
    stockQuantity:
      Math.round(
        ((medication.stockQuantity ?? 0) + payload.quantityDelta) * 1_000,
      ) / 1_000,
    updatedAt: timestamp,
  };
  const optimistic: MedicationInventoryAdjustmentResult = {
    medication: nextMedication,
    inventoryEvent: {
      id: entityId,
      medicationId: medication.id,
      doseEventId: null,
      quantityDelta: payload.quantityDelta,
      reason: payload.reason,
      note: payload.note ?? null,
      occurredAt: payload.occurredAt,
      createdAt: timestamp,
    },
  };
  const result = await saveOfflineFirst(
    ownerId,
    {
      operationId,
      entityId,
      entityType: "medication_inventory_event",
      mutation: "create",
      payload,
    },
    optimistic,
  );
  return { ...result, ...optimistic };
};

export const saveRoutineOccurrenceOfflineFirst = async (
  ownerId: string,
  input: RoutineOccurrenceWriteInput,
) => {
  const payload = routineOccurrenceWriteSchema.parse(input);
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const occurrence: RoutineOccurrenceDto = {
    ...payload,
    id: entityId,
    operationId,
    completedAt: payload.completedAt ?? null,
    note: payload.note ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const result = await saveOfflineFirst(
    ownerId,
    {
      operationId,
      entityId,
      entityType: "routine_occurrence",
      mutation: "create",
      payload,
    },
    occurrence,
  );
  return { ...result, occurrence };
};

export const saveAppointmentOfflineFirst = async (
  ownerId: string,
  input: AppointmentWriteInput,
) => {
  const payload = appointmentWriteSchema.parse(input);
  return saveOfflineFirst(ownerId, {
    operationId: Crypto.randomUUID(),
    entityId: Crypto.randomUUID(),
    entityType: "appointment",
    mutation: "create",
    payload,
  });
};

export const saveAppointmentQuestionOfflineFirst = async (
  ownerId: string,
  appointmentId: string,
  input: Omit<CreateAppointmentQuestionInput, "operationId" | "questionId">,
) => {
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const payload = createAppointmentQuestionSchema.parse({
    ...input,
    operationId,
    questionId: entityId,
  });
  const result = await saveOfflineFirst(ownerId, {
    operationId,
    entityId,
    entityType: "appointment_question",
    mutation: "create",
    payload: { ...payload, appointmentId },
  });
  return { ...result, operationId };
};

export const saveAppointmentEventOfflineFirst = async (
  ownerId: string,
  appointmentId: string,
  input: Omit<CreateAppointmentEventInput, "operationId" | "eventId">,
) => {
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const payload = createAppointmentEventSchema.parse({
    ...input,
    operationId,
    eventId: entityId,
  });
  const result = await saveOfflineFirst(ownerId, {
    operationId,
    entityId,
    entityType: "appointment_event",
    mutation: "create",
    payload: { ...payload, appointmentId },
  });
  return { ...result, operationId };
};

export const saveAppointmentDecisionOfflineFirst = async (
  ownerId: string,
  appointmentId: string,
  input: Omit<CreateAppointmentDecisionInput, "operationId" | "decisionId">,
) => {
  const operationId = Crypto.randomUUID();
  const entityId = Crypto.randomUUID();
  const payload = createAppointmentDecisionSchema.parse({
    ...input,
    operationId,
    decisionId: entityId,
  });
  const result = await saveOfflineFirst(ownerId, {
    operationId,
    entityId,
    entityType: "appointment_decision",
    mutation: "create",
    payload: { ...payload, appointmentId },
  });
  return { ...result, operationId };
};

export const flushPendingOperations = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const rows = await database.getAllAsync<PendingRow>(
    `SELECT operation_id, entity_id, entity_type, mutation, base_version, payload
     FROM pending_sync_operation
     WHERE state = 'pending' ORDER BY created_at ASC LIMIT 50`,
  );
  const operations: SyncPushOperation[] = [];
  const parseAt = async (index: number): Promise<void> => {
    const row = rows[index];
    if (!row) return;
    try {
      operations.push({
        operationId: row.operation_id,
        entityId: row.entity_id,
        entityType: row.entity_type,
        mutation: row.mutation,
        baseVersion: row.base_version,
        payload: JSON.parse(row.payload) as unknown,
      });
    } catch {
      await database.runAsync(
        "UPDATE pending_sync_operation SET state = 'rejected', error_code = 'local_payload_invalid' WHERE operation_id = ?",
        row.operation_id,
      );
      if (row.mutation === "create") {
        await database.runAsync(
          "DELETE FROM sync_snapshot WHERE entity_type = ? AND entity_id = ?",
          row.entity_type,
          row.entity_id,
        );
      }
    }
    return parseAt(index + 1);
  };
  await parseAt(0);
  if (operations.length === 0) return;

  const operationsById = new Map(
    operations.map((operation) => [operation.operationId, operation]),
  );
  const response = await pushOperations(operations);
  const reconcileAt = async (index: number): Promise<void> => {
    const result = response.results[index];
    if (!result) return;
    if (result.status === "applied" || result.status === "duplicate") {
      await database.runAsync(
        "DELETE FROM pending_sync_operation WHERE operation_id = ?",
        result.operationId,
      );
    } else {
      await database.runAsync(
        "UPDATE pending_sync_operation SET state = ?, error_code = ? WHERE operation_id = ?",
        result.status,
        result.code,
        result.operationId,
      );
      const operation = operationsById.get(result.operationId);
      if (operation?.mutation === "create") {
        await database.runAsync(
          "DELETE FROM sync_snapshot WHERE entity_type = ? AND entity_id = ?",
          operation.entityType,
          operation.entityId,
        );
      }
    }
    return reconcileAt(index + 1);
  };
  await reconcileAt(0);
};

const pullChanges = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const metadata = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = ?",
    SYNC_CURSOR_KEY,
  );
  const pullPage = async (cursor?: string): Promise<void> => {
    const response = await api.pullSync(cursor, 100);
    await database.withTransactionAsync(async () => {
      const persistAt = async (index: number): Promise<void> => {
        const change = response.changes[index];
        if (!change) return;
        if (!change.entityId) return persistAt(index + 1);
        await database.runAsync(
          `INSERT INTO sync_snapshot (entity_type, entity_id, payload, changed_at, deleted)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(entity_type, entity_id) DO UPDATE SET
             payload = excluded.payload,
             changed_at = excluded.changed_at,
             deleted = excluded.deleted`,
          change.entityType,
          change.entityId,
          change.data === null ? null : JSON.stringify(change.data),
          change.changedAt,
          change.data === null ? 1 : 0,
        );
        return persistAt(index + 1);
      };
      await persistAt(0);
      if (response.nextCursor) {
        await database.runAsync(
          `INSERT INTO sync_metadata (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          SYNC_CURSOR_KEY,
          response.nextCursor,
        );
      }
    });
    if (response.hasMore && response.nextCursor) {
      await pullPage(response.nextCursor);
    }
  };
  await pullPage(metadata?.value);
};

export const synchronizeNow = async (ownerId: string) => {
  await flushPendingOperations(ownerId);
  await pullChanges(ownerId);
};

export type HealthRawSampleRecord = {
  sampleType: string;
  sampleId: string;
  localDate: string;
  observedAt: string;
  payload: unknown;
};

export const storeRawHealthSamples = async (
  ownerId: string,
  samples: readonly HealthRawSampleRecord[],
) => {
  const database = await getLocalDatabase(ownerId);
  await database.withTransactionAsync(async () => {
    const storeAt = async (index: number): Promise<void> => {
      const sample = samples[index];
      if (!sample) return;
      await database.runAsync(
        `INSERT INTO health_raw_sample
          (sample_type, sample_id, local_date, payload, observed_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(sample_type, sample_id) DO UPDATE SET
           local_date = excluded.local_date,
           payload = excluded.payload,
           observed_at = excluded.observed_at`,
        sample.sampleType,
        sample.sampleId,
        sample.localDate,
        JSON.stringify(sample.payload),
        sample.observedAt,
      );
      return storeAt(index + 1);
    };
    await storeAt(0);
  });
};

export const deleteRawHealthSamples = async (
  ownerId: string,
  period?: { from?: string; to?: string },
) => {
  const database = await getLocalDatabase(ownerId);
  if (!period?.from && !period?.to) {
    const result = await database.runAsync("DELETE FROM health_raw_sample");
    return result.changes;
  }
  const clauses: string[] = [];
  const values: string[] = [];
  if (period.from) {
    clauses.push("local_date >= ?");
    values.push(period.from);
  }
  if (period.to) {
    clauses.push("local_date <= ?");
    values.push(period.to);
  }
  const result = await database.runAsync(
    `DELETE FROM health_raw_sample WHERE ${clauses.join(" AND ")}`,
    ...values,
  );
  return result.changes;
};

export const cacheSafetyPlan = async (ownerId: string, plan: SafetyPlanDto) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    `INSERT INTO safety_plan_snapshot (id, payload, cached_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       payload = excluded.payload,
       cached_at = excluded.cached_at`,
    JSON.stringify(plan),
    new Date().toISOString(),
  );
};

export const getCachedSafetyPlan = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const row = await database.getFirstAsync<SnapshotRow>(
    "SELECT payload FROM safety_plan_snapshot WHERE id = 1",
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as SafetyPlanDto;
  } catch {
    await database.runAsync("DELETE FROM safety_plan_snapshot WHERE id = 1");
    return null;
  }
};

const readSnapshots = async <T>(
  ownerId: string,
  entityType: SnapshotEntityType,
): Promise<T[]> => {
  const database = await getLocalDatabase(ownerId);
  const rows = await database.getAllAsync<SnapshotRow>(
    `SELECT payload FROM sync_snapshot
     WHERE entity_type = ? AND deleted = 0 ORDER BY changed_at DESC`,
    entityType,
  );
  return rows.flatMap((row) => {
    try {
      return [JSON.parse(row.payload) as T];
    } catch {
      return [];
    }
  });
};

const persistSnapshots = async <T extends { id: string }>(
  ownerId: string,
  entityType: SnapshotEntityType,
  values: T[],
  changedAt: (value: T) => string,
) => {
  const database = await getLocalDatabase(ownerId);
  await database.withTransactionAsync(async () => {
    const persistAt = async (index: number): Promise<void> => {
      const value = values[index];
      if (!value) return;
      await database.runAsync(
        `INSERT INTO sync_snapshot (entity_type, entity_id, payload, changed_at, deleted)
         VALUES (?, ?, ?, ?, 0)
         ON CONFLICT(entity_type, entity_id) DO UPDATE SET
           payload = excluded.payload,
           changed_at = excluded.changed_at,
           deleted = 0`,
        entityType,
        value.id,
        JSON.stringify(value),
        changedAt(value),
      );
      return persistAt(index + 1);
    };
    await persistAt(0);
  });
};

export const refreshTreatmentSnapshots = async (
  ownerId: string,
  localDate: string,
  timezone: string,
) => {
  const [medicationPage, doseEvents] = await Promise.all([
    api.listMedications(undefined, true),
    api.listDoseEvents(localDate, timezone),
  ]);
  await Promise.all([
    persistSnapshots(
      ownerId,
      "medication",
      medicationPage.items,
      (medication) => medication.updatedAt,
    ),
    persistSnapshots(
      ownerId,
      "dose_event",
      doseEvents,
      (event) => event.updatedAt,
    ),
  ]);
};

export const getCachedRoutines = async (ownerId: string) =>
  readSnapshots<RoutineDto>(ownerId, "routine");
export const getCachedRoutineOccurrences = async (ownerId: string) =>
  readSnapshots<RoutineOccurrenceDto>(ownerId, "routine_occurrence");
export const getCachedMedications = async (ownerId: string) => {
  const [medications, adjustments] = await Promise.all([
    readSnapshots<MedicationDto>(ownerId, "medication"),
    readSnapshots<MedicationInventoryAdjustmentResult>(
      ownerId,
      "medication_inventory_event",
    ),
  ]);
  const latest = new Map(
    adjustments
      .sort(
        (left, right) =>
          new Date(left.medication.updatedAt).getTime() -
          new Date(right.medication.updatedAt).getTime(),
      )
      .map((result) => [result.medication.id, result.medication]),
  );
  return medications.map(
    (medication) => latest.get(medication.id) ?? medication,
  );
};
export const getCachedDoseEvents = async (ownerId: string) => {
  const [events, corrections] = await Promise.all([
    readSnapshots<DoseEventDto>(ownerId, "dose_event"),
    readSnapshots<DoseEventCorrectionResult>(ownerId, "dose_event_correction"),
  ]);
  const latest = new Map(
    corrections
      .sort(
        (left, right) =>
          new Date(left.correction.createdAt).getTime() -
          new Date(right.correction.createdAt).getTime(),
      )
      .map((result) => [result.event.id, result.event]),
  );
  return events.map((event) => latest.get(event.id) ?? event);
};
export const getCachedAppointments = async (ownerId: string) =>
  readSnapshots<AppointmentDto>(ownerId, "appointment");
export const getCachedAppointmentQuestions = async (
  ownerId: string,
  appointmentId?: string,
) => {
  const questions = await readSnapshots<AppointmentQuestionDto>(
    ownerId,
    "appointment_question",
  );
  return appointmentId
    ? questions.filter((question) => question.appointmentId === appointmentId)
    : questions;
};
export const getCachedAppointmentEvents = async (
  ownerId: string,
  appointmentId?: string,
) => {
  const events = await readSnapshots<AppointmentEventDto>(
    ownerId,
    "appointment_event",
  );
  return appointmentId
    ? events.filter((event) => event.appointmentId === appointmentId)
    : events;
};
export const getCachedAppointmentDecisions = async (
  ownerId: string,
  appointmentId?: string,
) => {
  const decisions = await readSnapshots<AppointmentDecisionDto>(
    ownerId,
    "appointment_decision",
  );
  return appointmentId
    ? decisions.filter((decision) => decision.appointmentId === appointmentId)
    : decisions;
};

export const cacheMedicationDetail = async (
  ownerId: string,
  detail: MedicationDetailDto,
) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    `INSERT INTO medication_detail_snapshot (medication_id, payload, cached_at)
     VALUES (?, ?, ?)
     ON CONFLICT(medication_id) DO UPDATE SET
       payload = excluded.payload,
       cached_at = excluded.cached_at`,
    detail.medication.id,
    JSON.stringify(detail),
    new Date().toISOString(),
  );
};

export const getCachedMedicationDetail = async (
  ownerId: string,
  medicationId: string,
) => {
  const database = await getLocalDatabase(ownerId);
  const row = await database.getFirstAsync<SnapshotRow>(
    "SELECT payload FROM medication_detail_snapshot WHERE medication_id = ?",
    medicationId,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as MedicationDetailDto;
  } catch {
    await database.runAsync(
      "DELETE FROM medication_detail_snapshot WHERE medication_id = ?",
      medicationId,
    );
    return null;
  }
};

// Compatibility alias for the first Today prototype.
export const flushPendingCheckIns = flushPendingOperations;

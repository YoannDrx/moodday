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
  syncedPreferencesSchema,
  syncedPreferencesWriteSchema,
  userDraftSchema,
  userDraftWriteSchema,
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
  type SyncedPreferencesDto,
  type SyncedPreferencesWriteInput,
  type SyncEntityType,
  type SyncPushOperation,
  type UserDraftDto,
  type UserDraftKind,
  type UserDraftWriteInput,
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

type MutableStateRow = {
  entity_type: "user_draft" | "user_preferences";
  entity_id: string;
  context_key: string;
  base_version: string | null;
  payload: string;
  state: "synced" | "dirty" | "delete_pending" | "conflict";
};

type OperationCountRow = {
  state: "pending" | "conflict" | "rejected";
  count: number;
};

const databasePromises = new Map<string, Promise<SQLite.SQLiteDatabase>>();
const mutableFlushPromises = new Map<string, Promise<void>>();

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
      entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'medication', 'dose_event', 'dose_event_correction', 'medication_inventory_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision', 'user_draft', 'user_preferences')),
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
    CREATE TABLE IF NOT EXISTS mutable_sync_state (
      entity_type TEXT NOT NULL CHECK (entity_type IN ('user_draft', 'user_preferences')),
      entity_id TEXT NOT NULL,
      context_key TEXT NOT NULL,
      base_version TEXT,
      payload TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('synced', 'dirty', 'delete_pending', 'conflict')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (entity_type, context_key)
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
  if ((schemaVersion?.user_version ?? 0) < 9) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE pending_sync_operation_v9 (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'medication', 'dose_event', 'dose_event_correction', 'medication_inventory_event', 'routine', 'routine_occurrence', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision', 'user_draft', 'user_preferences')),
          mutation TEXT NOT NULL CHECK (mutation IN ('create', 'update', 'delete')),
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'conflict', 'rejected')),
          error_code TEXT,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO pending_sync_operation_v9
          (operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at)
        SELECT operation_id, entity_id, entity_type, mutation, base_version, payload, state, error_code, created_at
        FROM pending_sync_operation;
        DROP TABLE pending_sync_operation;
        ALTER TABLE pending_sync_operation_v9 RENAME TO pending_sync_operation;
        CREATE INDEX pending_sync_operation_state_created_at_idx
          ON pending_sync_operation(state, created_at);
        CREATE TABLE IF NOT EXISTS mutable_sync_state (
          entity_type TEXT NOT NULL CHECK (entity_type IN ('user_draft', 'user_preferences')),
          entity_id TEXT NOT NULL,
          context_key TEXT NOT NULL,
          base_version TEXT,
          payload TEXT NOT NULL,
          state TEXT NOT NULL CHECK (state IN ('synced', 'dirty', 'delete_pending', 'conflict')),
          updated_at TEXT NOT NULL,
          PRIMARY KEY (entity_type, context_key)
        );
        PRAGMA user_version = 9;
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
  const database = await getLocalDatabase(ownerId);
  const unsyncedDraft = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM mutable_sync_state
     WHERE entity_type = 'user_draft' AND state != 'synced'`,
  );
  if ((unsyncedDraft?.count ?? 0) > 0) {
    throw new Error("unsynced_draft_must_be_resolved");
  }
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
  const mutable = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM mutable_sync_state
     WHERE state IN ('dirty', 'delete_pending')`,
  );
  return (row?.count ?? 0) + (mutable?.count ?? 0);
};

export const getLocalOperationSummary = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const rows = await database.getAllAsync<OperationCountRow>(
    `SELECT state, COUNT(*) AS count
     FROM pending_sync_operation
     GROUP BY state`,
  );
  const summary = createLocalOperationSummary(rows);
  const mutable = await database.getAllAsync<{
    state: "dirty" | "delete_pending" | "conflict";
    count: number;
  }>(
    `SELECT state, COUNT(*) AS count FROM mutable_sync_state
     WHERE state != 'synced' GROUP BY state`,
  );
  for (const row of mutable) {
    if (row.state === "conflict") summary.conflict += row.count;
    else summary.pending += row.count;
    summary.total += row.count;
  }
  return summary;
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

const storeMutableState = async ({
  ownerId,
  entityType,
  entityId,
  contextKey,
  baseVersion,
  payload,
  state,
}: {
  ownerId: string;
  entityType: "user_draft" | "user_preferences";
  entityId: string;
  contextKey: string;
  baseVersion: string | null;
  payload: unknown;
  state: MutableStateRow["state"];
}) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    `INSERT INTO mutable_sync_state
      (entity_type, entity_id, context_key, base_version, payload, state, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(entity_type, context_key) DO UPDATE SET
       entity_id = excluded.entity_id,
       base_version = excluded.base_version,
       payload = excluded.payload,
       state = excluded.state,
       updated_at = excluded.updated_at`,
    entityType,
    entityId,
    contextKey,
    baseVersion,
    JSON.stringify(payload),
    state,
    new Date().toISOString(),
  );
};

const markMutableConflict = async (
  ownerId: string,
  entityType: MutableStateRow["entity_type"],
  contextKey: string,
) => {
  const database = await getLocalDatabase(ownerId);
  await database.runAsync(
    `UPDATE mutable_sync_state SET state = 'conflict', updated_at = ?
     WHERE entity_type = ? AND context_key = ?`,
    new Date().toISOString(),
    entityType,
    contextKey,
  );
};

const pushMutableOperation = async (
  operation: Omit<SyncPushOperation, "operationId">,
) => {
  const operationId = Crypto.randomUUID();
  const response = await pushOperations([{ ...operation, operationId }]);
  return response.results[0];
};

const flushDraftMutableState = async (
  ownerId: string,
  row: MutableStateRow,
) => {
  const draft = userDraftSchema.parse(JSON.parse(row.payload));
  const server = await api.getUserDraft(draft.kind, draft.contextKey);
  if (
    (server &&
      (server.id !== row.entity_id || server.updatedAt !== row.base_version)) ||
    (!server && row.base_version !== null)
  ) {
    await markMutableConflict(ownerId, "user_draft", row.context_key);
    return;
  }
  if (row.state === "delete_pending" && !server) {
    const database = await getLocalDatabase(ownerId);
    await database.runAsync(
      "DELETE FROM mutable_sync_state WHERE entity_type = 'user_draft' AND context_key = ?",
      row.context_key,
    );
    return;
  }
  const result = await pushMutableOperation({
    entityId: row.entity_id,
    entityType: "user_draft",
    mutation:
      row.state === "delete_pending" ? "delete" : server ? "update" : "create",
    baseVersion: server?.updatedAt ?? null,
    payload:
      row.state === "delete_pending" ? null : userDraftWriteSchema.parse(draft),
  });
  if (
    !result ||
    (result.status !== "applied" && result.status !== "duplicate")
  ) {
    if (result?.status === "conflict" || result?.status === "rejected") {
      await markMutableConflict(ownerId, "user_draft", row.context_key);
    }
    return;
  }
  const database = await getLocalDatabase(ownerId);
  if (row.state === "delete_pending") {
    await database.runAsync(
      "DELETE FROM mutable_sync_state WHERE entity_type = 'user_draft' AND context_key = ?",
      row.context_key,
    );
    return;
  }
  const canonical = await api.getUserDraft(draft.kind, draft.contextKey);
  if (canonical) {
    await storeMutableState({
      ownerId,
      entityType: "user_draft",
      entityId: canonical.id,
      contextKey: row.context_key,
      baseVersion: canonical.updatedAt,
      payload: canonical,
      state: "synced",
    });
  }
};

const flushPreferencesMutableState = async (
  ownerId: string,
  row: MutableStateRow,
) => {
  const preferences = syncedPreferencesSchema.parse(JSON.parse(row.payload));
  const server = await api.getSyncedPreferences();
  if (
    (server &&
      (server.id !== row.entity_id || server.updatedAt !== row.base_version)) ||
    (!server && row.base_version !== null)
  ) {
    await markMutableConflict(ownerId, "user_preferences", row.context_key);
    return;
  }
  const result = await pushMutableOperation({
    entityId: row.entity_id,
    entityType: "user_preferences",
    mutation: server ? "update" : "create",
    baseVersion: server?.updatedAt ?? null,
    payload: syncedPreferencesWriteSchema.parse(preferences),
  });
  if (
    !result ||
    (result.status !== "applied" && result.status !== "duplicate")
  ) {
    if (result?.status === "conflict" || result?.status === "rejected") {
      await markMutableConflict(ownerId, "user_preferences", row.context_key);
    }
    return;
  }
  const canonical = await api.getSyncedPreferences();
  if (canonical) {
    await storeMutableState({
      ownerId,
      entityType: "user_preferences",
      entityId: canonical.id,
      contextKey: "account",
      baseVersion: canonical.updatedAt,
      payload: canonical,
      state: "synced",
    });
  }
};

const runMutableSyncFlush = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const rows = await database.getAllAsync<MutableStateRow>(
    `SELECT entity_type, entity_id, context_key, base_version, payload, state
     FROM mutable_sync_state
     WHERE state IN ('dirty', 'delete_pending') ORDER BY updated_at ASC`,
  );
  const flushAt = async (index: number): Promise<void> => {
    const row = rows[index];
    if (!row) return;
    try {
      if (row.entity_type === "user_draft") {
        await flushDraftMutableState(ownerId, row);
      } else {
        await flushPreferencesMutableState(ownerId, row);
      }
    } catch {
      // Network and provider errors leave the encrypted state dirty for retry.
    }
    return flushAt(index + 1);
  };
  await flushAt(0);
};

const flushMutableSyncStates = async (ownerId: string) => {
  const existing = mutableFlushPromises.get(ownerId);
  if (existing) {
    await existing;
    return flushMutableSyncStates(ownerId);
  }
  const promise = runMutableSyncFlush(ownerId).finally(() => {
    mutableFlushPromises.delete(ownerId);
  });
  mutableFlushPromises.set(ownerId, promise);
  return promise;
};

export const synchronizeNow = async (ownerId: string) => {
  await flushPendingOperations(ownerId);
  await pullChanges(ownerId);
  await flushMutableSyncStates(ownerId);
  await pullChanges(ownerId);
};

const getMutableState = async (
  ownerId: string,
  entityType: MutableStateRow["entity_type"],
  contextKey: string,
) => {
  const database = await getLocalDatabase(ownerId);
  return database.getFirstAsync<MutableStateRow>(
    `SELECT entity_type, entity_id, context_key, base_version, payload, state
     FROM mutable_sync_state WHERE entity_type = ? AND context_key = ?`,
    entityType,
    contextKey,
  );
};

export const refreshUserDraft = async (
  ownerId: string,
  kind: UserDraftKind,
  contextKey: string,
) => {
  const localKey = `${kind}:${contextKey}`;
  const local = await getMutableState(ownerId, "user_draft", localKey);
  if (local && local.state !== "synced")
    return userDraftSchema.parse(JSON.parse(local.payload));
  const server = await api.getUserDraft(kind, contextKey);
  if (!server) return null;
  await storeMutableState({
    ownerId,
    entityType: "user_draft",
    entityId: server.id,
    contextKey: localKey,
    baseVersion: server.updatedAt,
    payload: server,
    state: "synced",
  });
  return server;
};

export const getCachedUserDraft = async (
  ownerId: string,
  kind: UserDraftKind,
  contextKey: string,
) => {
  const row = await getMutableState(
    ownerId,
    "user_draft",
    `${kind}:${contextKey}`,
  );
  return row ? userDraftSchema.parse(JSON.parse(row.payload)) : null;
};

export const saveUserDraftLocally = async (
  ownerId: string,
  input: UserDraftWriteInput,
) => {
  const draft = userDraftWriteSchema.parse(input);
  const localKey = `${draft.kind}:${draft.contextKey}`;
  const current = await getMutableState(ownerId, "user_draft", localKey);
  const now = new Date().toISOString();
  const value: UserDraftDto = {
    id: current?.entity_id ?? Crypto.randomUUID(),
    ...draft,
    createdAt: current
      ? userDraftSchema.parse(JSON.parse(current.payload)).createdAt
      : now,
    updatedAt: now,
  };
  await storeMutableState({
    ownerId,
    entityType: "user_draft",
    entityId: value.id,
    contextKey: localKey,
    baseVersion: current?.base_version ?? null,
    payload: value,
    state: "dirty",
  });
  await flushMutableSyncStates(ownerId);
  const stored = await getMutableState(ownerId, "user_draft", localKey);
  return { draft: value, pending: stored?.state !== "synced" };
};

export const discardUserDraft = async (
  ownerId: string,
  kind: UserDraftKind,
  contextKey: string,
) => {
  const localKey = `${kind}:${contextKey}`;
  const current = await getMutableState(ownerId, "user_draft", localKey);
  const server = await api.getUserDraft(kind, contextKey).catch(() => null);
  if (!server && current?.base_version == null) {
    const database = await getLocalDatabase(ownerId);
    await database.runAsync(
      "DELETE FROM mutable_sync_state WHERE entity_type = 'user_draft' AND context_key = ?",
      localKey,
    );
    return;
  }
  let value: UserDraftDto;
  if (server) value = server;
  else {
    if (!current) return;
    value = userDraftSchema.parse(JSON.parse(current.payload));
  }
  await storeMutableState({
    ownerId,
    entityType: "user_draft",
    entityId: value.id,
    contextKey: localKey,
    baseVersion: server?.updatedAt ?? current?.base_version ?? null,
    payload: value,
    state: "delete_pending",
  });
  await flushMutableSyncStates(ownerId);
};

export const refreshSyncedPreferences = async (ownerId: string) => {
  const current = await getMutableState(ownerId, "user_preferences", "account");
  if (current && current.state !== "synced") {
    return syncedPreferencesSchema.parse(JSON.parse(current.payload));
  }
  const server = await api.getSyncedPreferences();
  if (!server) return null;
  await storeMutableState({
    ownerId,
    entityType: "user_preferences",
    entityId: server.id,
    contextKey: "account",
    baseVersion: server.updatedAt,
    payload: server,
    state: "synced",
  });
  return server;
};

export const saveSyncedPreferencesLocally = async (
  ownerId: string,
  input: SyncedPreferencesWriteInput,
) => {
  const preferences = syncedPreferencesWriteSchema.parse(input);
  const current = await getMutableState(ownerId, "user_preferences", "account");
  const value: SyncedPreferencesDto = {
    id: current?.entity_id ?? Crypto.randomUUID(),
    ...preferences,
    updatedAt: new Date().toISOString(),
  };
  await storeMutableState({
    ownerId,
    entityType: "user_preferences",
    entityId: value.id,
    contextKey: "account",
    baseVersion: current?.base_version ?? null,
    payload: value,
    state: "dirty",
  });
  await flushMutableSyncStates(ownerId);
  const stored = await getMutableState(ownerId, "user_preferences", "account");
  return {
    preferences: stored
      ? syncedPreferencesSchema.parse(JSON.parse(stored.payload))
      : value,
    pending: stored?.state !== "synced",
  };
};

export const getMutableConflictCount = async (ownerId: string) => {
  const database = await getLocalDatabase(ownerId);
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM mutable_sync_state WHERE state = 'conflict'",
  );
  return row?.count ?? 0;
};

export const resolveMutableConflicts = async (
  ownerId: string,
  strategy: "keep_local" | "use_server",
) => {
  const database = await getLocalDatabase(ownerId);
  const rows = await database.getAllAsync<MutableStateRow>(
    `SELECT entity_type, entity_id, context_key, base_version, payload, state
     FROM mutable_sync_state WHERE state = 'conflict' ORDER BY updated_at ASC`,
  );
  const resolveAt = async (index: number): Promise<void> => {
    const row = rows[index];
    if (!row) return;
    if (row.entity_type === "user_draft") {
      const local = userDraftSchema.parse(JSON.parse(row.payload));
      const server = await api.getUserDraft(local.kind, local.contextKey);
      if (strategy === "use_server") {
        if (server) {
          await storeMutableState({
            ownerId,
            entityType: "user_draft",
            entityId: server.id,
            contextKey: row.context_key,
            baseVersion: server.updatedAt,
            payload: server,
            state: "synced",
          });
        } else {
          await database.runAsync(
            "DELETE FROM mutable_sync_state WHERE entity_type = 'user_draft' AND context_key = ?",
            row.context_key,
          );
        }
      } else {
        await storeMutableState({
          ownerId,
          entityType: "user_draft",
          entityId: server?.id ?? local.id,
          contextKey: row.context_key,
          baseVersion: server?.updatedAt ?? null,
          payload: { ...local, id: server?.id ?? local.id },
          state: "dirty",
        });
      }
    } else {
      const local = syncedPreferencesSchema.parse(JSON.parse(row.payload));
      const server = await api.getSyncedPreferences();
      if (strategy === "use_server") {
        if (server) {
          await storeMutableState({
            ownerId,
            entityType: "user_preferences",
            entityId: server.id,
            contextKey: "account",
            baseVersion: server.updatedAt,
            payload: server,
            state: "synced",
          });
        }
      } else {
        await storeMutableState({
          ownerId,
          entityType: "user_preferences",
          entityId: server?.id ?? local.id,
          contextKey: "account",
          baseVersion: server?.updatedAt ?? null,
          payload: { ...local, id: server?.id ?? local.id },
          state: "dirty",
        });
      }
    }
    return resolveAt(index + 1);
  };
  await resolveAt(0);
  if (strategy === "keep_local") await flushMutableSyncStates(ownerId);
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

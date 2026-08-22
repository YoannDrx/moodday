import {
  createAppointmentDecisionSchema,
  createAppointmentEventSchema,
  createAppointmentQuestionSchema,
  appointmentWriteSchema,
  createCheckInSchema,
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
  type RoutineDto,
  type RoutineWriteInput,
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
      entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'routine', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
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
          entity_type TEXT NOT NULL CHECK (entity_type IN ('check_in', 'routine', 'appointment', 'appointment_question', 'appointment_event', 'appointment_decision')),
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
) => {
  const database = await getLocalDatabase(ownerId);
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
    new Date().toISOString(),
  );
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

const saveOfflineFirst = async (
  ownerId: string,
  operation: SyncPushOperation,
) =>
  persistOperationBeforeSync(operation, {
    queue: async () => queueOperation(ownerId, operation),
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
    }
    return parseAt(index + 1);
  };
  await parseAt(0);
  if (operations.length === 0) return;

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

const readSnapshots = async <T>(
  ownerId: string,
  entityType: SyncEntityType,
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

export const getCachedRoutines = async (ownerId: string) =>
  readSnapshots<RoutineDto>(ownerId, "routine");
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

// Compatibility alias for the first Today prototype.
export const flushPendingCheckIns = flushPendingOperations;

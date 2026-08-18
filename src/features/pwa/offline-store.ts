"use client";

import { getSafeTimeZone } from "@/lib/temporal/civil-date";

export type OfflineOperationKind = "action" | "mood";
export type OfflineOperationStatus =
  | "pending"
  | "syncing"
  | "failed"
  | "conflict";

export type OfflineErrorCategory =
  | "authorization"
  | "conflict"
  | "network"
  | "quota"
  | "server"
  | "unknown";

export type OfflineOperation<TPayload = unknown> = {
  id: string;
  ownerId: string;
  schemaVersion: 2;
  kind: OfflineOperationKind;
  payload: TPayload;
  status: OfflineOperationStatus;
  retryCount: number;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
  localDateAtCreation: string;
  timeZoneAtCreation: string;
  expectedVersion?: string;
  nextAttemptAt?: string;
  lastError?: string;
  errorCategory?: OfflineErrorCategory;
};

type PersistedOfflineOperation = Omit<OfflineOperation, "payload"> & {
  ciphertext: string;
  iv: string;
};

type OfflineKeyRecord = {
  ownerId: string;
  key: CryptoKey;
};

const DATABASE_NAME = "moodday-offline";
const DATABASE_VERSION = 2;
const OPERATIONS_STORE = "operations";
const KEYS_STORE = "keys";
const LEGACY_QUEUE_KEYS = [
  "moodday.offline.actions",
  "moodday.offline.mood",
] as const;
const QUEUE_MARKER_PREFIX = "moodday.offline.pending.v2.";
const SNAPSHOT_PREFIX = "moodday.offline.snapshot.v2.";
const ACTIVE_OWNER_KEY = "moodday.offline.active-owner.v2";
export const OFFLINE_DATA_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type EncryptedOfflineSnapshot = {
  ownerId: string;
  name: string;
  schemaVersion: number;
  ciphertext: string;
  iv: string;
  updatedAt: string;
};

const getSnapshotKey = (ownerId: string, name: string) =>
  `${SNAPSHOT_PREFIX}${ownerId}.${name}`;

const removeLocalStorageKeysByPrefix = (prefix: string) => {
  if (typeof window === "undefined") return;
  const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index),
  ).filter((key): key is string => key?.startsWith(prefix) === true);
  keys.forEach((key) => window.localStorage.removeItem(key));
};

export const setActiveOfflineOwner = (ownerId?: string) => {
  if (typeof window === "undefined") return;
  if (ownerId?.trim()) window.localStorage.setItem(ACTIVE_OWNER_KEY, ownerId);
  else window.localStorage.removeItem(ACTIVE_OWNER_KEY);
  window.dispatchEvent(
    new CustomEvent("moodday:offline-owner-changed", {
      detail: { ownerId: ownerId ?? null },
    }),
  );
};

export const getActiveOfflineOwner = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_OWNER_KEY);
};

const getQueueMarkerKey = (ownerId: string) =>
  `${QUEUE_MARKER_PREFIX}${ownerId}`;

const setQueueMarker = (ownerId: string, pending: boolean) => {
  if (typeof window === "undefined") return;
  const key = getQueueMarkerKey(ownerId);
  if (pending) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);
};

/**
 * Conservative synchronous hint used before sign-out. A missing marker means
 * no V2 operation was ever committed for this owner in this browser profile.
 */
export const mayHaveOfflineOperations = (ownerId: string) => {
  assertOwner(ownerId);
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(getQueueMarkerKey(ownerId)) === "1";
};

export class OfflineStorageQuotaError extends Error {
  override name = "OfflineStorageQuotaError";

  constructor() {
    super("The offline storage quota has been reached");
  }
}

export const isOfflineStorageQuotaError = (error: unknown) => {
  if (error instanceof OfflineStorageQuotaError) return true;
  const candidate = error as { name?: string; code?: number } | null;
  return (
    candidate?.name === "QuotaExceededError" ||
    candidate?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    candidate?.code === 22 ||
    candidate?.code === 1014
  );
};

const normalizeOfflineStorageError = (error: unknown) =>
  isOfflineStorageQuotaError(error) ? new OfflineStorageQuotaError() : error;

export const getOfflineStorageErrorMessage = (
  error: unknown,
  messages: { quota: string; fallback: string },
) => {
  if (isOfflineStorageQuotaError(error)) return messages.quota;
  return error instanceof Error ? error.message : messages.fallback;
};

export const getSafeOfflineTimeZone = (candidate?: string | null) => {
  const resolved =
    candidate ??
    (typeof Intl === "undefined"
      ? undefined
      : Intl.DateTimeFormat().resolvedOptions().timeZone);
  return getSafeTimeZone(resolved);
};

export const getOfflineFailureStatus = (
  message: string,
): OfflineOperationStatus =>
  /not found|only .* own|as-needed|invalid|unauthori[sz]ed|forbidden|conflict|changed after the offline action/i.test(
    message,
  )
    ? "conflict"
    : "failed";

export const getOfflineErrorCategory = (
  message: string,
): OfflineErrorCategory => {
  if (/unauthori[sz]ed|forbidden|only .* own/i.test(message)) {
    return "authorization";
  }
  if (/not found|conflict|changed after the offline action/i.test(message)) {
    return "conflict";
  }
  if (/network|fetch|offline|timeout/i.test(message)) return "network";
  if (/quota|storage/i.test(message)) return "quota";
  if (/server|unavailable|5\d\d/i.test(message)) return "server";
  return "unknown";
};

let databasePromise: Promise<IDBDatabase> | undefined;
let legacyPurgePromise: Promise<void> | undefined;
const ownerKeyPromises = new Map<string, Promise<CryptoKey>>();

const requestToPromise = async <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        normalizeOfflineStorageError(
          request.error ?? new Error("IndexedDB error"),
        ),
      );
  });

const transactionToPromise = async (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(
        normalizeOfflineStorageError(
          transaction.error ?? new Error("IndexedDB transaction aborted"),
        ),
      );
    transaction.onerror = () =>
      reject(
        normalizeOfflineStorageError(
          transaction.error ?? new Error("IndexedDB transaction failed"),
        ),
      );
  });

const openDatabase = async () => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const database = request.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
      const store = database.objectStoreNames.contains(OPERATIONS_STORE)
        ? request.transaction?.objectStore(OPERATIONS_STORE)
        : database.createObjectStore(OPERATIONS_STORE, { keyPath: "id" });

      if (store) {
        // V1 records have no trustworthy owner. Keeping them would risk a
        // cross-account disclosure, so the V1 -> V2 migration intentionally
        // discards them.
        if (oldVersion > 0 && oldVersion < 2) store.clear();
        if (!store.indexNames.contains("ownerId")) {
          store.createIndex("ownerId", "ownerId", { unique: false });
        }
        if (!store.indexNames.contains("ownerKind")) {
          store.createIndex("ownerKind", ["ownerId", "kind"], {
            unique: false,
          });
        }
        if (!store.indexNames.contains("status")) {
          store.createIndex("status", "status", { unique: false });
        }
        if (!store.indexNames.contains("createdAt")) {
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      }

      if (!database.objectStoreNames.contains(KEYS_STORE)) {
        database.createObjectStore(KEYS_STORE, { keyPath: "ownerId" });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = undefined;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error ?? new Error("Unable to open IndexedDB"));
    };
    request.onblocked = () => {
      databasePromise = undefined;
      reject(new Error("IndexedDB upgrade is blocked by another tab"));
    };
  });

  return databasePromise;
};

const purgeUnownedLegacyQueues = async () => {
  if (typeof window === "undefined") return;
  LEGACY_QUEUE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

const ensureLegacyQueuesPurged = async () => {
  legacyPurgePromise ??= purgeUnownedLegacyQueues().catch((error) => {
    legacyPurgePromise = undefined;
    throw error;
  });
  return legacyPurgePromise;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const loadOrCreateOwnerKey = async (ownerId: string) => {
  const database = await openDatabase();
  const readTransaction = database.transaction(KEYS_STORE, "readonly");
  const existing = (await requestToPromise(
    readTransaction.objectStore(KEYS_STORE).get(ownerId),
  )) as OfflineKeyRecord | undefined;
  if (existing?.key) return existing.key;

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const writeTransaction = database.transaction(KEYS_STORE, "readwrite");
  const writeCompleted = transactionToPromise(writeTransaction);
  writeTransaction.objectStore(KEYS_STORE).put({ ownerId, key });
  await writeCompleted;
  return key;
};

const getOrCreateOwnerKey = async (ownerId: string) => {
  const existing = ownerKeyPromises.get(ownerId);
  if (existing) return existing;
  const pending = loadOrCreateOwnerKey(ownerId).catch((error) => {
    ownerKeyPromises.delete(ownerId);
    throw error;
  });
  ownerKeyPromises.set(ownerId, pending);
  return pending;
};

const getOwnerKey = async (ownerId: string) => {
  const cached = ownerKeyPromises.get(ownerId);
  if (cached) return cached;
  const database = await openDatabase();
  const transaction = database.transaction(KEYS_STORE, "readonly");
  const record = (await requestToPromise(
    transaction.objectStore(KEYS_STORE).get(ownerId),
  )) as OfflineKeyRecord | undefined;
  if (!record?.key) throw new Error("Offline encryption key is unavailable");
  ownerKeyPromises.set(ownerId, Promise.resolve(record.key));
  return record.key;
};

const getAdditionalData = (ownerId: string, operationId: string) =>
  new TextEncoder().encode(`${ownerId}:${operationId}:2`);

const encryptPayload = async (
  ownerId: string,
  operationId: string,
  payload: unknown,
) => {
  const key = await getOrCreateOwnerKey(ownerId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: getAdditionalData(ownerId, operationId),
    },
    key,
    plaintext,
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
};

const decryptOperation = async <TPayload>(
  operation: PersistedOfflineOperation,
): Promise<OfflineOperation<TPayload>> => {
  const key = await getOwnerKey(operation.ownerId);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(operation.iv),
      additionalData: getAdditionalData(operation.ownerId, operation.id),
    },
    key,
    base64ToBytes(operation.ciphertext),
  );
  const { ciphertext: _ciphertext, iv: _iv, ...metadata } = operation;
  return {
    ...metadata,
    payload: JSON.parse(new TextDecoder().decode(decrypted)) as TPayload,
  };
};

export const saveEncryptedOfflineSnapshot = async <TPayload>(
  ownerId: string,
  name: string,
  payload: TPayload,
) => {
  assertOwner(ownerId);
  if (!name.trim()) throw new Error("An offline snapshot name is required");
  const operationId = `snapshot:${name}`;
  const encrypted = await encryptPayload(ownerId, operationId, payload);
  const snapshot: EncryptedOfflineSnapshot = {
    ownerId,
    name,
    schemaVersion: 2,
    ...encrypted,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    getSnapshotKey(ownerId, name),
    JSON.stringify(snapshot),
  );
  setActiveOfflineOwner(ownerId);
  return snapshot.updatedAt;
};

export const getEncryptedOfflineSnapshot = async <TPayload>(
  ownerId: string,
  name: string,
): Promise<TPayload | null> => {
  assertOwner(ownerId);
  if (!name.trim()) throw new Error("An offline snapshot name is required");
  const raw = window.localStorage.getItem(getSnapshotKey(ownerId, name));
  if (!raw) return null;
  const snapshot = JSON.parse(raw) as EncryptedOfflineSnapshot;
  if (
    snapshot.ownerId !== ownerId ||
    snapshot.name !== name ||
    snapshot.schemaVersion !== 2
  ) {
    return null;
  }
  try {
    const key = await getOwnerKey(ownerId);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(snapshot.iv),
        additionalData: getAdditionalData(ownerId, `snapshot:${name}`),
      },
      key,
      base64ToBytes(snapshot.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as TPayload;
  } catch {
    window.localStorage.removeItem(getSnapshotKey(ownerId, name));
    return null;
  }
};

const assertOwner = (ownerId: string) => {
  if (!ownerId.trim()) throw new Error("An offline queue owner is required");
};

export const addOfflineOperation = async <TPayload>(
  operation: OfflineOperation<TPayload>,
) => {
  assertOwner(operation.ownerId);
  // Set before the IndexedDB write so a crash can only leave a false positive,
  // never allow a silent sign-out while an operation may have been persisted.
  setQueueMarker(operation.ownerId, true);
  await ensureLegacyQueuesPurged();
  const encrypted = await encryptPayload(
    operation.ownerId,
    operation.id,
    operation.payload,
  );
  const database = await openDatabase();
  const readTransaction = database.transaction(OPERATIONS_STORE, "readonly");
  const existingOperations = (await requestToPromise(
    readTransaction
      .objectStore(OPERATIONS_STORE)
      .index("ownerId")
      .getAll(operation.ownerId),
  )) as PersistedOfflineOperation[];
  const queuePosition =
    operation.queuePosition ??
    existingOperations.reduce(
      (highest, item) => Math.max(highest, item.queuePosition ?? 0),
      0,
    ) + 1;
  const { payload: _payload, ...metadata } = operation;
  const writeTransaction = database.transaction(OPERATIONS_STORE, "readwrite");
  const writeCompleted = transactionToPromise(writeTransaction);
  writeTransaction
    .objectStore(OPERATIONS_STORE)
    .add({ ...metadata, ...encrypted, queuePosition });
  await writeCompleted;
  return { ...operation, queuePosition };
};

export const listOfflineOperations = async <TPayload>(
  ownerId: string,
  kind: OfflineOperationKind,
) => {
  assertOwner(ownerId);
  await ensureLegacyQueuesPurged();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readonly");
  const request = transaction
    .objectStore(OPERATIONS_STORE)
    .index("ownerKind")
    .getAll([ownerId, kind]);
  const encrypted = (await requestToPromise(
    request,
  )) as PersistedOfflineOperation[];
  const operations = await Promise.all(
    encrypted.map(async (operation) => decryptOperation<TPayload>(operation)),
  );
  return operations.sort((a, b) => {
    const dateOrder = a.createdAt.localeCompare(b.createdAt);
    if (dateOrder !== 0) return dateOrder;
    const positionOrder =
      (a.queuePosition ?? Number.MAX_SAFE_INTEGER) -
      (b.queuePosition ?? Number.MAX_SAFE_INTEGER);
    return positionOrder !== 0 ? positionOrder : a.id.localeCompare(b.id);
  });
};

export const countOfflineOperations = async (
  ownerId: string,
  kind?: OfflineOperationKind,
) => {
  assertOwner(ownerId);
  await ensureLegacyQueuesPurged();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readonly");
  const store = transaction.objectStore(OPERATIONS_STORE);
  const request = kind
    ? store.index("ownerKind").count([ownerId, kind])
    : store.index("ownerId").count(ownerId);
  const count = await requestToPromise(request);
  return count;
};

export const updateOfflineOperation = async <TPayload>(
  ownerId: string,
  id: string,
  patch: Partial<OfflineOperation<TPayload>>,
) => {
  assertOwner(ownerId);
  await ensureLegacyQueuesPurged();
  const database = await openDatabase();
  const readTransaction = database.transaction(OPERATIONS_STORE, "readonly");
  const current = (await requestToPromise(
    readTransaction.objectStore(OPERATIONS_STORE).get(id),
  )) as PersistedOfflineOperation | undefined;

  if (!current || current.ownerId !== ownerId) {
    throw new Error(`Offline operation ${id} was not found`);
  }

  const {
    payload,
    ownerId: _ownerId,
    id: _id,
    kind: _kind,
    ...safePatch
  } = patch;
  const encrypted =
    payload === undefined
      ? { ciphertext: current.ciphertext, iv: current.iv }
      : await encryptPayload(ownerId, id, payload);
  const updated: PersistedOfflineOperation = {
    ...current,
    ...safePatch,
    ...encrypted,
    id: current.id,
    ownerId: current.ownerId,
    kind: current.kind,
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
  };
  const writeTransaction = database.transaction(OPERATIONS_STORE, "readwrite");
  const writeCompleted = transactionToPromise(writeTransaction);
  writeTransaction.objectStore(OPERATIONS_STORE).put(updated);
  await writeCompleted;
  return decryptOperation<TPayload>(updated);
};

export const removeOfflineOperation = async (ownerId: string, id: string) => {
  assertOwner(ownerId);
  await ensureLegacyQueuesPurged();
  const database = await openDatabase();
  const readTransaction = database.transaction(OPERATIONS_STORE, "readonly");
  const current = (await requestToPromise(
    readTransaction.objectStore(OPERATIONS_STORE).get(id),
  )) as PersistedOfflineOperation | undefined;
  if (current?.ownerId !== ownerId) return;
  const writeTransaction = database.transaction(OPERATIONS_STORE, "readwrite");
  const writeCompleted = transactionToPromise(writeTransaction);
  writeTransaction.objectStore(OPERATIONS_STORE).delete(id);
  await writeCompleted;
  const remaining = await countOfflineOperations(ownerId);
  if (remaining === 0) setQueueMarker(ownerId, false);
};

export const purgeOfflineDataForOwner = async (ownerId: string) => {
  assertOwner(ownerId);
  const database = await openDatabase();
  const transaction = database.transaction(
    [OPERATIONS_STORE, KEYS_STORE],
    "readwrite",
  );
  const completed = transactionToPromise(transaction);
  const operationStore = transaction.objectStore(OPERATIONS_STORE);
  // Keep all mutations inside IndexedDB request callbacks. Safari/WebKit can
  // auto-commit a transaction while JavaScript awaits an intermediate
  // request, making later deletes inactive or indefinitely blocked.
  const cursorRequest = operationStore
    .index("ownerId")
    .openKeyCursor(IDBKeyRange.only(ownerId));
  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    operationStore.delete(cursor.primaryKey);
    cursor.continue();
  };
  transaction.objectStore(KEYS_STORE).delete(ownerId);
  await completed;
  ownerKeyPromises.delete(ownerId);
  setQueueMarker(ownerId, false);
  if (typeof window !== "undefined") {
    removeLocalStorageKeysByPrefix(`${SNAPSHOT_PREFIX}${ownerId}.`);
    if (getActiveOfflineOwner() === ownerId) setActiveOfflineOwner();
  }
};

export const clearOfflineOperations = async () => {
  const database = await openDatabase();
  const transaction = database.transaction(
    [OPERATIONS_STORE, KEYS_STORE],
    "readwrite",
  );
  const completed = transactionToPromise(transaction);
  transaction.objectStore(OPERATIONS_STORE).clear();
  transaction.objectStore(KEYS_STORE).clear();
  await completed;
  ownerKeyPromises.clear();
  if (typeof window !== "undefined") {
    removeLocalStorageKeysByPrefix(SNAPSHOT_PREFIX);
    setActiveOfflineOwner();
  }
};

export const compactOfflineOperations = async (
  ownerId: string,
  options?: {
    now?: Date;
    staleSyncAfterMs?: number;
    retentionMs?: number;
  },
) => {
  assertOwner(ownerId);
  await ensureLegacyQueuesPurged();
  const database = await openDatabase();
  const readTransaction = database.transaction(OPERATIONS_STORE, "readonly");
  const operations = (await requestToPromise(
    readTransaction
      .objectStore(OPERATIONS_STORE)
      .index("ownerId")
      .getAll(ownerId),
  )) as PersistedOfflineOperation[];
  const now = options?.now ?? new Date();
  const staleBefore =
    now.getTime() - (options?.staleSyncAfterMs ?? 5 * 60 * 1000);
  const retentionBefore =
    now.getTime() - (options?.retentionMs ?? OFFLINE_DATA_RETENTION_MS);
  let recovered = 0;
  let normalizedErrors = 0;
  const expiredOperationIds: string[] = [];
  const updates: PersistedOfflineOperation[] = [];

  for (const operation of operations) {
    const createdAt = new Date(operation.createdAt).getTime();
    // An operation without a trustworthy creation timestamp cannot satisfy the
    // bounded local-retention policy, so purge it instead of retaining it
    // indefinitely.
    if (!Number.isFinite(createdAt) || createdAt <= retentionBefore) {
      expiredOperationIds.push(operation.id);
      continue;
    }
    const updatedAt = new Date(operation.updatedAt).getTime();
    const staleSync =
      operation.status === "syncing" &&
      (!Number.isFinite(updatedAt) || updatedAt <= staleBefore);
    const normalizedError = operation.lastError?.slice(0, 240);
    const shouldNormalizeError = normalizedError !== operation.lastError;
    if (!staleSync && !shouldNormalizeError) continue;

    updates.push({
      ...operation,
      ...(staleSync
        ? {
            status: "pending" as const,
            nextAttemptAt: undefined,
            lastError: undefined,
            errorCategory: undefined,
          }
        : { lastError: normalizedError }),
      updatedAt: now.toISOString(),
    });
    if (staleSync) recovered += 1;
    if (shouldNormalizeError) normalizedErrors += 1;
  }

  if (updates.length > 0 || expiredOperationIds.length > 0) {
    const writeTransaction = database.transaction(
      OPERATIONS_STORE,
      "readwrite",
    );
    const writeCompleted = transactionToPromise(writeTransaction);
    const store = writeTransaction.objectStore(OPERATIONS_STORE);
    updates.forEach((operation) => store.put(operation));
    expiredOperationIds.forEach((id) => store.delete(id));
    await writeCompleted;
  }

  let expiredSnapshots = 0;
  if (typeof window !== "undefined") {
    const snapshotPrefix = `${SNAPSHOT_PREFIX}${ownerId}.`;
    const keys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    ).filter((key): key is string => key?.startsWith(snapshotPrefix) === true);
    for (const key of keys) {
      const raw = window.localStorage.getItem(key);
      try {
        const snapshot = JSON.parse(
          raw ?? "null",
        ) as Partial<EncryptedOfflineSnapshot> | null;
        const updatedAt = new Date(snapshot?.updatedAt ?? "").getTime();
        if (Number.isFinite(updatedAt) && updatedAt > retentionBefore) continue;
      } catch {
        // Corrupt encrypted metadata has no safe retention timestamp.
      }
      window.localStorage.removeItem(key);
      expiredSnapshots += 1;
    }
  }

  if (expiredOperationIds.length > 0) {
    const remaining = await countOfflineOperations(ownerId);
    if (remaining === 0) setQueueMarker(ownerId, false);
  }

  return {
    scanned: operations.length,
    recovered,
    normalizedErrors,
    expiredOperations: expiredOperationIds.length,
    expiredSnapshots,
  };
};

export const closeOfflineDatabase = async () => {
  if (!databasePromise) return;
  try {
    const database = await databasePromise;
    database.close();
  } finally {
    databasePromise = undefined;
  }
};

export const getOfflineRetryDelay = (retryCount: number) =>
  Math.min(30_000 * 2 ** Math.max(retryCount - 1, 0), 60 * 60 * 1000);

export const isOfflineOperationDue = (operation: OfflineOperation) =>
  !operation.nextAttemptAt ||
  new Date(operation.nextAttemptAt).getTime() <= Date.now();

export const retryOfflineOperation = async (ownerId: string, id: string) =>
  updateOfflineOperation(ownerId, id, {
    status: "pending",
    retryCount: 0,
    nextAttemptAt: undefined,
    lastError: undefined,
    errorCategory: undefined,
  });

export const discardOfflineOperation = removeOfflineOperation;

"use client";

export type OfflineOperationKind = "action" | "mood";
export type OfflineOperationStatus =
  | "pending"
  | "syncing"
  | "failed"
  | "conflict";

export type OfflineOperation<TPayload = unknown> = {
  id: string;
  kind: OfflineOperationKind;
  payload: TPayload;
  status: OfflineOperationStatus;
  retryCount: number;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
  timeZoneAtCreation?: string;
  nextAttemptAt?: string;
  lastError?: string;
};

const DATABASE_NAME = "moodday-offline";
const DATABASE_VERSION = 1;
const OPERATIONS_STORE = "operations";
const LEGACY_QUEUES = [
  { key: "moodday.offline.actions", kind: "action" },
  { key: "moodday.offline.mood", kind: "mood" },
] as const;

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
      ? "UTC"
      : Intl.DateTimeFormat().resolvedOptions().timeZone);

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: resolved }).format();
    return resolved;
  } catch {
    return "UTC";
  }
};

export const getOfflineFailureStatus = (
  message: string,
): OfflineOperationStatus =>
  /not found|only .* own|as-needed|invalid|unauthori[sz]ed|forbidden|conflict|changed after the offline action/i.test(
    message,
  )
    ? "conflict"
    : "failed";

let databasePromise: Promise<IDBDatabase> | undefined;
let legacyMigrationPromise: Promise<void> | undefined;

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

    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(OPERATIONS_STORE)
        ? request.transaction?.objectStore(OPERATIONS_STORE)
        : database.createObjectStore(OPERATIONS_STORE, { keyPath: "id" });

      if (!store) return;
      if (!store.indexNames.contains("kind")) {
        store.createIndex("kind", "kind", { unique: false });
      }
      if (!store.indexNames.contains("status")) {
        store.createIndex("status", "status", { unique: false });
      }
      if (!store.indexNames.contains("createdAt")) {
        store.createIndex("createdAt", "createdAt", { unique: false });
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

const migrateLegacyQueues = async () => {
  if (typeof window === "undefined") return;

  const legacyEntries = LEGACY_QUEUES.flatMap(({ key, kind }) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as {
        id?: string;
        payload?: unknown;
        createdAt?: string;
      }[];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (
            entry,
          ): entry is {
            id: string;
            payload: unknown;
            createdAt?: string;
          } => typeof entry.id === "string" && "payload" in entry,
        )
        .map((entry) => {
          const createdAt = entry.createdAt ?? new Date().toISOString();
          return {
            id: `${kind}:${entry.id}`,
            kind,
            payload: entry.payload,
            status: "pending",
            retryCount: 0,
            createdAt,
            updatedAt: createdAt,
          } satisfies OfflineOperation;
        });
    } catch {
      return [];
    }
  });

  if (legacyEntries.length > 0) {
    const database = await openDatabase();
    const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
    const store = transaction.objectStore(OPERATIONS_STORE);
    legacyEntries.forEach((entry) => store.put(entry));
    await transactionToPromise(transaction);
  }

  LEGACY_QUEUES.forEach(({ key }) => window.localStorage.removeItem(key));
};

const ensureLegacyQueuesMigrated = async () => {
  legacyMigrationPromise ??= migrateLegacyQueues().catch((error) => {
    legacyMigrationPromise = undefined;
    throw error;
  });
  return legacyMigrationPromise;
};

export const addOfflineOperation = async <TPayload>(
  operation: OfflineOperation<TPayload>,
) => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
  const store = transaction.objectStore(OPERATIONS_STORE);
  const existingOperations = (await requestToPromise(
    store.getAll(),
  )) as OfflineOperation[];
  const queuePosition =
    operation.queuePosition ??
    existingOperations.reduce(
      (highest, item) => Math.max(highest, item.queuePosition ?? 0),
      0,
    ) + 1;
  const queuedOperation = { ...operation, queuePosition };

  store.add(queuedOperation);
  await transactionToPromise(transaction);
  return queuedOperation;
};

export const listOfflineOperations = async <TPayload>(
  kind: OfflineOperationKind,
) => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readonly");
  const request = transaction
    .objectStore(OPERATIONS_STORE)
    .index("kind")
    .getAll(kind);
  const operations = (await requestToPromise(
    request,
  )) as OfflineOperation<TPayload>[];
  await transactionToPromise(transaction);
  return operations.sort((a, b) => {
    const dateOrder = a.createdAt.localeCompare(b.createdAt);
    if (dateOrder !== 0) return dateOrder;

    const positionOrder =
      (a.queuePosition ?? Number.MAX_SAFE_INTEGER) -
      (b.queuePosition ?? Number.MAX_SAFE_INTEGER);
    if (positionOrder !== 0) return positionOrder;

    return a.id.localeCompare(b.id);
  });
};

export const countOfflineOperations = async (kind?: OfflineOperationKind) => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readonly");
  const store = transaction.objectStore(OPERATIONS_STORE);
  const request = kind ? store.index("kind").count(kind) : store.count();
  const count = await requestToPromise(request);
  await transactionToPromise(transaction);
  return count;
};

export const updateOfflineOperation = async <TPayload>(
  id: string,
  patch: Partial<OfflineOperation<TPayload>>,
) => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
  const store = transaction.objectStore(OPERATIONS_STORE);
  const current = (await requestToPromise(store.get(id))) as
    | OfflineOperation<TPayload>
    | undefined;

  if (!current) {
    transaction.abort();
    throw new Error(`Offline operation ${id} was not found`);
  }

  const updated = {
    ...current,
    ...patch,
    id: current.id,
    kind: current.kind,
    updatedAt: new Date().toISOString(),
  } satisfies OfflineOperation<TPayload>;
  store.put(updated);
  await transactionToPromise(transaction);
  return updated;
};

export const removeOfflineOperation = async (id: string) => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
  transaction.objectStore(OPERATIONS_STORE).delete(id);
  await transactionToPromise(transaction);
};

export const clearOfflineOperations = async () => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
  transaction.objectStore(OPERATIONS_STORE).clear();
  await transactionToPromise(transaction);
};

export const compactOfflineOperations = async (options?: {
  now?: Date;
  staleSyncAfterMs?: number;
}) => {
  await ensureLegacyQueuesMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(OPERATIONS_STORE, "readwrite");
  const store = transaction.objectStore(OPERATIONS_STORE);
  const operations = (await requestToPromise(
    store.getAll(),
  )) as OfflineOperation[];
  const now = options?.now ?? new Date();
  const staleBefore =
    now.getTime() - (options?.staleSyncAfterMs ?? 5 * 60 * 1000);
  let recovered = 0;
  let normalizedErrors = 0;

  for (const operation of operations) {
    const updatedAt = new Date(operation.updatedAt).getTime();
    const staleSync =
      operation.status === "syncing" &&
      (!Number.isFinite(updatedAt) || updatedAt <= staleBefore);
    const normalizedError = operation.lastError?.slice(0, 240);
    const shouldNormalizeError = normalizedError !== operation.lastError;

    if (!staleSync && !shouldNormalizeError) continue;

    store.put({
      ...operation,
      ...(staleSync
        ? {
            status: "pending" as const,
            nextAttemptAt: undefined,
            lastError: undefined,
          }
        : { lastError: normalizedError }),
      updatedAt: now.toISOString(),
    });
    if (staleSync) recovered += 1;
    if (shouldNormalizeError) normalizedErrors += 1;
  }

  await transactionToPromise(transaction);
  return {
    scanned: operations.length,
    recovered,
    normalizedErrors,
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

export const retryOfflineOperation = async (id: string) =>
  updateOfflineOperation(id, {
    status: "pending",
    retryCount: 0,
    nextAttemptAt: undefined,
    lastError: undefined,
  });

export const discardOfflineOperation = removeOfflineOperation;

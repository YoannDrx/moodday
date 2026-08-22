import type { SyncPushOperation, SyncPushResult } from "@moodday/contracts";

export type OwnerStorageIdentity = {
  databaseName: string;
  keyReference: string;
};

export type LocalOperationSummary = {
  pending: number;
  conflict: number;
  rejected: number;
  total: number;
};

export type SessionOwnerTransition = "adopt" | "lock" | "none";

export const normalizeLocalOwnerId = (ownerId: string) => {
  const normalized = ownerId.trim();
  if (!normalized) throw new Error("local_database_owner_required");
  return normalized;
};

export const createOwnerStorageIdentity = (
  ownerHash: string,
): OwnerStorageIdentity => {
  const normalizedHash = ownerHash.toLowerCase();
  if (!/^[a-f\d]{64}$/u.test(normalizedHash)) {
    throw new Error("local_database_owner_hash_invalid");
  }
  return {
    databaseName: `moodday-v2-${normalizedHash.slice(0, 32)}.db`,
    keyReference: `moodday.database-key.v2.${normalizedHash}`,
  };
};

export const createLocalOperationSummary = (
  rows: readonly {
    state: "pending" | "conflict" | "rejected";
    count: number;
  }[],
): LocalOperationSummary => {
  const summary = { pending: 0, conflict: 0, rejected: 0, total: 0 };
  for (const row of rows) {
    if (!Number.isSafeInteger(row.count) || row.count < 0) {
      throw new Error("local_operation_count_invalid");
    }
    summary[row.state] += row.count;
    summary.total += row.count;
  }
  return summary;
};

export const getSessionOwnerTransition = ({
  currentOwnerId,
  isPending,
  previousOwnerId,
}: {
  currentOwnerId?: string;
  isPending: boolean;
  previousOwnerId?: string;
}): SessionOwnerTransition => {
  if (isPending) return "none";
  if (previousOwnerId && previousOwnerId !== currentOwnerId) return "lock";
  if (!previousOwnerId && currentOwnerId) return "adopt";
  return "none";
};

class SyncRejectedError extends Error {}

const isTerminalApiError = (
  error: unknown,
): error is Error & { code: string; recoverable: boolean } =>
  error instanceof Error &&
  "code" in error &&
  typeof error.code === "string" &&
  "recoverable" in error &&
  typeof error.recoverable === "boolean" &&
  (error.code === "authentication_required" || !error.recoverable);

type OfflineOperationAdapters = {
  markRejected: (code: string) => Promise<void>;
  push: () => Promise<SyncPushResult>;
  queue: () => Promise<void>;
  remove: () => Promise<void>;
};

export const persistOperationBeforeSync = async (
  operation: SyncPushOperation,
  adapters: OfflineOperationAdapters,
) => {
  await adapters.queue();
  try {
    const response = await adapters.push();
    const result = response.results[0];
    if (
      !result ||
      (result.status !== "applied" && result.status !== "duplicate")
    ) {
      throw new SyncRejectedError(result?.code ?? "sync_operation_rejected");
    }
    await adapters.remove();
    return { pending: false, entityId: operation.entityId } as const;
  } catch (error) {
    if (isTerminalApiError(error)) {
      await adapters.remove();
      throw error;
    }
    if (error instanceof SyncRejectedError) {
      await adapters.markRejected(error.message);
      throw error;
    }
    return { pending: true, entityId: operation.entityId } as const;
  }
};

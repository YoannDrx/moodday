import type {
  OfflineOperation,
  OfflineOperationKind,
  OfflineOperationStatus,
} from "./offline-store";

type StorageEstimate = {
  usage?: number;
  quota?: number;
};

const countBy = <T extends string>(values: T[]) =>
  values.reduce<Partial<Record<T, number>>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});

export const buildOfflineDiagnostic = (params: {
  operations: OfflineOperation[];
  generatedAt?: Date;
  online: boolean;
  storage?: StorageEstimate;
}) => {
  const sortedDates = params.operations
    .map((operation) => operation.createdAt)
    .sort((a, b) => a.localeCompare(b));
  const usage = params.storage?.usage ?? null;
  const quota = params.storage?.quota ?? null;

  return {
    schemaVersion: "1.0",
    generatedAt: (params.generatedAt ?? new Date()).toISOString(),
    connection: params.online ? "online" : "offline",
    queue: {
      operationCount: params.operations.length,
      byKind: countBy<OfflineOperationKind>(
        params.operations.map((operation) => operation.kind),
      ),
      byStatus: countBy<OfflineOperationStatus>(
        params.operations.map((operation) => operation.status),
      ),
      retryCount: {
        total: params.operations.reduce(
          (total, operation) => total + operation.retryCount,
          0,
        ),
        maximum: Math.max(
          0,
          ...params.operations.map((operation) => operation.retryCount),
        ),
      },
      oldestCreatedAt: sortedDates[0] ?? null,
      newestCreatedAt: sortedDates.at(-1) ?? null,
    },
    storage: {
      usageBytes: usage,
      quotaBytes: quota,
      usagePercent:
        usage !== null && quota !== null && quota > 0
          ? Math.round((usage / quota) * 10_000) / 100
          : null,
    },
    excludedFields: [
      "operation identifiers",
      "payloads",
      "journal content",
      "medication details",
      "therapy notes",
      "error messages",
      "user identifiers",
    ],
  };
};

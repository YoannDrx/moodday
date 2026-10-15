import "server-only";
/* eslint-disable no-await-in-loop -- aggregate ownership checks and idempotent upserts share one bounded transaction. */

import type {
  ConnectHealthKitInput,
  HealthAggregateDto,
  HealthAggregateWriteInput,
  HealthSourceConnectionDto,
  ImportHealthAggregatesInput,
  UpdateHealthSourceInput,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class HealthDataServiceError extends Error {
  constructor(
    readonly code:
      | "healthkit_unavailable"
      | "health_source_inactive"
      | "health_source_not_found"
      | "health_metric_not_permitted"
      | "health_operation_conflict",
  ) {
    super(code);
    this.name = "HealthDataServiceError";
  }
}

const sourceSelection = {
  id: true,
  kind: true,
  status: true,
  permissionScope: true,
  pausedAt: true,
  revokedAt: true,
  lastSyncedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedSource = Prisma.SourceConnectionGetPayload<{
  select: typeof sourceSelection;
}>;

const toIso = (value: Date | null) => value?.toISOString() ?? null;

export const toHealthSourceDto = (
  source: SelectedSource,
): HealthSourceConnectionDto => {
  if (source.kind !== "healthkit") {
    throw new HealthDataServiceError("health_source_not_found");
  }
  return {
    ...source,
    kind: "healthkit",
    permissionScope:
      source.permissionScope as HealthSourceConnectionDto["permissionScope"],
    pausedAt: toIso(source.pausedAt),
    revokedAt: toIso(source.revokedAt),
    lastSyncedAt: toIso(source.lastSyncedAt),
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
};

export const getHealthKitConnection = async (userId: string) => {
  const source = await prisma.sourceConnection.findFirst({
    where: { userId, kind: "healthkit" },
    orderBy: { createdAt: "desc" },
    select: sourceSelection,
  });
  return source ? toHealthSourceDto(source) : null;
};

export const connectHealthKit = async (
  userId: string,
  input: ConnectHealthKitInput,
): Promise<HealthSourceConnectionDto> =>
  prisma.$transaction(
    async (transaction) => {
      const existing = await transaction.sourceConnection.findFirst({
        where: { userId, kind: "healthkit" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      const source = existing
        ? await transaction.sourceConnection.update({
            where: { id: existing.id },
            data: {
              status: "active",
              permissionScope: input.permissionScope,
              pausedAt: null,
              revokedAt: null,
            },
            select: sourceSelection,
          })
        : await transaction.sourceConnection.create({
            data: {
              userId,
              kind: "healthkit",
              status: "active",
              permissionScope: input.permissionScope,
            },
            select: sourceSelection,
          });
      return toHealthSourceDto(source);
    },
    { isolationLevel: "Serializable" },
  );

const findOwnedSource = async (
  userId: string,
  connectionId: string,
  transaction: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  const source = await transaction.sourceConnection.findFirst({
    where: { id: connectionId, userId, kind: "healthkit" },
    select: sourceSelection,
  });
  if (!source) throw new HealthDataServiceError("health_source_not_found");
  return source;
};

export const updateHealthKitConnection = async (
  userId: string,
  connectionId: string,
  input: UpdateHealthSourceInput,
) => {
  await findOwnedSource(userId, connectionId);
  const source = await prisma.sourceConnection.update({
    where: { id: connectionId },
    data: {
      status: input.status,
      ...(input.permissionScope
        ? { permissionScope: input.permissionScope }
        : {}),
      pausedAt: input.status === "paused" ? new Date() : null,
      revokedAt: null,
    },
    select: sourceSelection,
  });
  return toHealthSourceDto(source);
};

export const revokeHealthKitConnection = async (
  userId: string,
  connectionId: string,
) =>
  prisma.$transaction(async (transaction) => {
    await findOwnedSource(userId, connectionId, transaction);
    const aggregates = await transaction.dailyAggregate.deleteMany({
      where: { userId, sourceConnectionId: connectionId },
    });
    const source = await transaction.sourceConnection.update({
      where: { id: connectionId },
      data: { status: "revoked", revokedAt: new Date(), pausedAt: null },
      select: sourceSelection,
    });
    return {
      source: toHealthSourceDto(source),
      deletedAggregates: aggregates.count,
    };
  });

const aggregateSelection = {
  id: true,
  operationId: true,
  sourceConnectionId: true,
  metric: true,
  value: true,
  unit: true,
  localDate: true,
  timezone: true,
  windowStart: true,
  windowEnd: true,
  provenance: true,
  coverage: true,
  quality: true,
  algorithmVersion: true,
  importedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedAggregate = Prisma.DailyAggregateGetPayload<{
  select: typeof aggregateSelection;
}>;

export const toHealthAggregateDto = (
  aggregate: SelectedAggregate,
): HealthAggregateDto => {
  if (!aggregate.sourceConnectionId) {
    throw new HealthDataServiceError("health_source_not_found");
  }
  return {
    ...aggregate,
    sourceConnectionId: aggregate.sourceConnectionId,
    metric: aggregate.metric as HealthAggregateDto["metric"],
    value: aggregate.value.toNumber(),
    provenance: "healthkit",
    coverage: aggregate.coverage?.toNumber() ?? null,
    windowStart: aggregate.windowStart.toISOString(),
    windowEnd: aggregate.windowEnd.toISOString(),
    importedAt: aggregate.importedAt.toISOString(),
    createdAt: aggregate.createdAt.toISOString(),
    updatedAt: aggregate.updatedAt.toISOString(),
  };
};

const assertAggregateMatchesSource = (
  aggregate: HealthAggregateWriteInput,
  source: SelectedSource,
) => {
  if (source.status !== "active") {
    throw new HealthDataServiceError("health_source_inactive");
  }
  if (!source.permissionScope.includes(aggregate.metric)) {
    throw new HealthDataServiceError("health_metric_not_permitted");
  }
};

export const importHealthAggregates = async (
  userId: string,
  input: ImportHealthAggregatesInput,
) => {
  const connectionIds = new Set(
    input.aggregates.map((aggregate) => aggregate.sourceConnectionId),
  );
  if (connectionIds.size !== 1) {
    throw new HealthDataServiceError("health_operation_conflict");
  }
  const connectionId = input.aggregates[0]?.sourceConnectionId;
  if (!connectionId) {
    throw new HealthDataServiceError("health_operation_conflict");
  }

  return prisma.$transaction(async (transaction) => {
    const source = await findOwnedSource(userId, connectionId, transaction);
    for (const aggregate of input.aggregates) {
      assertAggregateMatchesSource(aggregate, source);
      const existing = await transaction.dailyAggregate.findUnique({
        where: {
          userId_operationId: { userId, operationId: aggregate.operationId },
        },
        select: {
          sourceConnectionId: true,
          metric: true,
          localDate: true,
        },
      });
      if (
        existing &&
        (existing.sourceConnectionId !== aggregate.sourceConnectionId ||
          existing.metric !== aggregate.metric ||
          existing.localDate !== aggregate.localDate)
      ) {
        throw new HealthDataServiceError("health_operation_conflict");
      }
      await transaction.dailyAggregate.upsert({
        where: {
          userId_operationId: { userId, operationId: aggregate.operationId },
        },
        create: {
          userId,
          sourceConnectionId: aggregate.sourceConnectionId,
          operationId: aggregate.operationId,
          metric: aggregate.metric,
          value: aggregate.value,
          unit: aggregate.unit,
          localDate: aggregate.localDate,
          timezone: aggregate.timezone,
          windowStart: new Date(aggregate.windowStart),
          windowEnd: new Date(aggregate.windowEnd),
          provenance: "healthkit",
          coverage: aggregate.coverage ?? null,
          quality: aggregate.quality,
          algorithmVersion: aggregate.algorithmVersion,
        },
        update: {
          value: aggregate.value,
          unit: aggregate.unit,
          timezone: aggregate.timezone,
          windowStart: new Date(aggregate.windowStart),
          windowEnd: new Date(aggregate.windowEnd),
          coverage: aggregate.coverage ?? null,
          quality: aggregate.quality,
          algorithmVersion: aggregate.algorithmVersion,
          importedAt: new Date(),
        },
      });
    }
    const syncedAt = new Date();
    await transaction.sourceConnection.update({
      where: { id: connectionId },
      data: { lastSyncedAt: syncedAt, status: "active" },
    });
    return {
      accepted: input.aggregates.length,
      sourceConnectionId: connectionId,
      lastSyncedAt: syncedAt.toISOString(),
    };
  });
};

export const listHealthAggregates = async ({
  userId,
  connectionId,
  from,
  to,
}: {
  userId: string;
  connectionId?: string;
  from: string;
  to: string;
}) => {
  const rows = await prisma.dailyAggregate.findMany({
    where: {
      userId,
      provenance: "healthkit",
      ...(connectionId ? { sourceConnectionId: connectionId } : {}),
      localDate: { gte: from, lte: to },
    },
    orderBy: [{ localDate: "desc" }, { metric: "asc" }],
    select: aggregateSelection,
  });
  return rows.map(toHealthAggregateDto);
};

export const deleteHealthAggregates = async ({
  userId,
  connectionId,
  from,
  to,
}: {
  userId: string;
  connectionId: string;
  from?: string;
  to?: string;
}) => {
  await findOwnedSource(userId, connectionId);
  const result = await prisma.dailyAggregate.deleteMany({
    where: {
      userId,
      sourceConnectionId: connectionId,
      provenance: "healthkit",
      ...(from || to
        ? {
            localDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
  });
  return { deleted: result.count };
};

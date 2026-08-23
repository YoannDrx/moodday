import { importHealthAggregatesSchema } from "@moodday/contracts";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  HealthDataServiceError,
  connectHealthKit,
  importHealthAggregates,
  revokeHealthKitConnection,
} from "@/features/v2/health/service";

const now = new Date("2026-08-23T12:00:00.000Z");
const source = {
  id: "health-connection-1",
  kind: "healthkit",
  status: "active",
  permissionScope: ["step_count"],
  pausedAt: null,
  revokedAt: null,
  lastSyncedAt: null,
  createdAt: now,
  updatedAt: now,
};

const aggregate = {
  operationId: "hk:v1:step_count:2026-08-23",
  sourceConnectionId: "health-connection-1",
  metric: "step_count" as const,
  value: 4321,
  unit: "count",
  localDate: "2026-08-23",
  timezone: "Europe/Paris",
  windowStart: "2026-08-22T22:00:00.000Z",
  windowEnd: "2026-08-23T12:00:00.000Z",
  coverage: null,
  quality: "partial" as const,
  algorithmVersion: "healthkit-daily-v1",
};

describe("V2 HealthKit server boundary", () => {
  beforeEach(() => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prisma) : Promise.all(callback),
    );
  });

  it("rejects raw sample fields at the public aggregate contract", () => {
    const parsed = importHealthAggregatesSchema.safeParse({
      aggregates: [{ ...aggregate, rawSamples: [{ value: 4321 }] }],
    });
    expect(parsed.success).toBe(false);
  });

  it("reactivates one existing source with the exact selected scope", async () => {
    vi.mocked(prisma.sourceConnection.findFirst).mockResolvedValue({
      id: source.id,
    } as never);
    vi.mocked(prisma.sourceConnection.update).mockResolvedValue({
      ...source,
      permissionScope: ["step_count", "sleep_duration_minutes"],
    } as never);

    await expect(
      connectHealthKit("user-1", {
        permissionScope: ["step_count", "sleep_duration_minutes"],
      }),
    ).resolves.toMatchObject({
      id: source.id,
      status: "active",
      permissionScope: ["step_count", "sleep_duration_minutes"],
    });
    expect(prisma.sourceConnection.update).toHaveBeenCalledWith({
      where: { id: source.id },
      data: expect.objectContaining({
        status: "active",
        permissionScope: ["step_count", "sleep_duration_minutes"],
        revokedAt: null,
      }),
      select: expect.any(Object),
    });
  });

  it("imports only permitted aggregates and stamps HealthKit provenance", async () => {
    vi.mocked(prisma.sourceConnection.findFirst).mockResolvedValue(
      source as never,
    );
    vi.mocked(prisma.dailyAggregate.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dailyAggregate.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.sourceConnection.update).mockResolvedValue({} as never);

    await expect(
      importHealthAggregates("user-1", { aggregates: [aggregate] }),
    ).resolves.toMatchObject({
      accepted: 1,
      sourceConnectionId: source.id,
    });
    expect(prisma.dailyAggregate.upsert).toHaveBeenCalledWith({
      where: {
        userId_operationId: {
          userId: "user-1",
          operationId: aggregate.operationId,
        },
      },
      create: expect.objectContaining({
        provenance: "healthkit",
        metric: "step_count",
        value: 4321,
      }),
      update: expect.not.objectContaining({ rawSamples: expect.anything() }),
    });
  });

  it("rejects a metric outside the stored permission scope", async () => {
    vi.mocked(prisma.sourceConnection.findFirst).mockResolvedValue(
      source as never,
    );
    const forbidden = {
      ...aggregate,
      operationId: "hk:v1:hrv_sdnn_ms:2026-08-23",
      metric: "hrv_sdnn_ms" as const,
      unit: "ms",
    };

    await expect(
      importHealthAggregates("user-1", { aggregates: [forbidden] }),
    ).rejects.toEqual(
      new HealthDataServiceError("health_metric_not_permitted"),
    );
    expect(prisma.dailyAggregate.upsert).not.toHaveBeenCalled();
  });

  it("revokes the source and deletes every synchronized aggregate atomically", async () => {
    vi.mocked(prisma.sourceConnection.findFirst).mockResolvedValue(
      source as never,
    );
    vi.mocked(prisma.dailyAggregate.deleteMany).mockResolvedValue({ count: 4 });
    vi.mocked(prisma.sourceConnection.update).mockResolvedValue({
      ...source,
      status: "revoked",
      revokedAt: now,
    } as never);

    await expect(
      revokeHealthKitConnection("user-1", source.id),
    ).resolves.toMatchObject({ deletedAggregates: 4 });
    expect(prisma.dailyAggregate.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", sourceConnectionId: source.id },
    });
  });
});

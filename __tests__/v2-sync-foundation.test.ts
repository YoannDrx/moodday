import { prisma } from "@/lib/prisma";
import { decodeSyncCursor, encodeSyncCursor } from "@/features/v2/sync/cursor";
import { createPayloadDigest } from "@/features/v2/sync/digest";
import { pushSyncOperations } from "@/features/v2/sync/service";
import { beforeEach, describe, expect, it, vi } from "vitest";

const device = { id: "device-database-id", revokedAt: null };

describe("V2 synchronization foundation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates stable opaque cursors and rejects malformed ones", () => {
    const cursor = encodeSyncCursor({
      changedAt: "2026-08-22T08:00:00.000Z",
      id: "sync-operation-1",
    });

    expect(cursor).not.toContain("2026-08-22");
    expect(decodeSyncCursor(cursor)).toEqual({
      changedAt: "2026-08-22T08:00:00.000Z",
      id: "sync-operation-1",
    });
    expect(decodeSyncCursor("not-a-cursor")).toBeNull();
  });

  it("stores a deterministic digest without retaining private text", () => {
    const privateText = "note privée à ne jamais conserver dans le reçu";
    const first = createPayloadDigest({ note: privateText, value: 3 });
    const reordered = createPayloadDigest({ value: 3, note: privateText });

    expect(first).toBe(reordered);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain(privateText);
  });

  it("returns an exactly-once duplicate without replaying the mutation", async () => {
    vi.mocked(prisma.device.upsert).mockResolvedValue(device as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue({
      status: "applied",
      entityId: "check-in-1",
    } as never);

    const result = await pushSyncOperations("user-1", {
      deviceId: "mobile-device-1",
      platform: "ios",
      operations: [
        {
          operationId: "operation-duplicate-1",
          entityId: "check-in-1",
          entityType: "check_in",
          mutation: "create",
          payload: {},
        },
      ],
    });

    expect(result.results[0]).toMatchObject({
      status: "duplicate",
      code: null,
    });
    expect(prisma.checkIn.create).not.toHaveBeenCalled();
  });

  it("requires the exact server version before updating mutable data", async () => {
    const currentVersion = new Date("2026-08-22T08:00:00.000Z");
    vi.mocked(prisma.device.upsert).mockResolvedValue(device as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.routine.findUnique).mockResolvedValue({
      userId: "user-1",
      updatedAt: currentVersion,
    } as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    const result = await pushSyncOperations("user-1", {
      deviceId: "mobile-device-1",
      platform: "ios",
      operations: [
        {
          operationId: "operation-routine-update-1",
          entityId: "routine-1",
          entityType: "routine",
          mutation: "update",
          baseVersion: "2026-08-21T08:00:00.000Z",
          payload: { title: "Marcher", status: "active" },
        },
      ],
    });

    expect(result.results[0]).toEqual({
      operationId: "operation-routine-update-1",
      entityId: "routine-1",
      status: "conflict",
      code: "version_conflict",
      currentVersion: currentVersion.toISOString(),
    });
    expect(prisma.routine.update).not.toHaveBeenCalled();
  });

  it("accepts an offline appointment event once and links it to an owned appointment", async () => {
    const createdAt = new Date("2026-08-22T09:00:00.000Z");
    vi.mocked(prisma.device.upsert).mockResolvedValue(device as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: "appointment-1",
    } as never);
    vi.mocked(prisma.appointmentEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.appointmentEvent.create).mockResolvedValue({
      createdAt,
    } as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    const result = await pushSyncOperations("user-1", {
      deviceId: "mobile-device-1",
      platform: "ios",
      operations: [
        {
          operationId: "operation-session-start-1",
          entityId: "appointment-event-1",
          entityType: "appointment_event",
          mutation: "create",
          payload: {
            appointmentId: "appointment-1",
            type: "session_started",
            occurredAt: "2026-08-22T09:00:00.000Z",
          },
        },
      ],
    });

    expect(result.results[0]).toEqual({
      operationId: "operation-session-start-1",
      entityId: "appointment-event-1",
      status: "applied",
      code: null,
      currentVersion: createdAt.toISOString(),
    });
    expect(prisma.appointmentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: "appointment-1",
          type: "session_started",
        }),
      }),
    );
  });

  it("creates one owned routine occurrence from the offline queue", async () => {
    const updatedAt = new Date("2026-08-22T18:00:00.000Z");
    vi.mocked(prisma.device.upsert).mockResolvedValue(device as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.routineOccurrence.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.routine.findFirst).mockResolvedValue({
      id: "routine-1",
    } as never);
    vi.mocked(prisma.routineOccurrence.create).mockResolvedValue({
      updatedAt,
    } as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    const result = await pushSyncOperations("user-1", {
      deviceId: "mobile-device-1",
      platform: "ios",
      operations: [
        {
          operationId: "operation-routine-occurrence-1",
          entityId: "routine-occurrence-1",
          entityType: "routine_occurrence",
          mutation: "create",
          payload: {
            routineId: "routine-1",
            localDate: "2026-08-22",
            timezone: "Europe/Paris",
            status: "completed",
            completedAt: "2026-08-22T18:00:00.000Z",
          },
        },
      ],
    });

    expect(result.results[0]).toEqual({
      operationId: "operation-routine-occurrence-1",
      entityId: "routine-occurrence-1",
      status: "applied",
      code: null,
      currentVersion: updatedAt.toISOString(),
    });
    expect(prisma.routineOccurrence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          routineId: "routine-1",
          localDate: "2026-08-22",
          status: "completed",
        }),
      }),
    );
  });
});

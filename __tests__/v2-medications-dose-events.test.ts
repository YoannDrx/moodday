import {
  createDoseEventSchema,
  doseEventWriteSchema,
} from "@moodday/contracts";
import fs from "node:fs";
import path from "node:path";
import {
  createDoseEvent,
  listDoseEvents,
  listMedications,
} from "@/features/v2/medications/service";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const timestamp = new Date("2026-08-23T07:30:00.000Z");
const selectedEvent = {
  id: "dose-event-1",
  medicationId: "medication-1",
  takenAt: timestamp,
  skipped: false,
  note: null,
  scheduledForDate: "2026-08-23",
  timezone: "Europe/Paris",
  doseIndex: 0,
  clientOperationId: "operation-dose-1",
  createdAt: timestamp,
  medication: { isPRN: false },
};

const input = {
  operationId: "operation-dose-1",
  entityId: "dose-event-1",
  medicationId: "medication-1",
  kind: "taken" as const,
  localDate: "2026-08-23",
  timezone: "Europe/Paris",
  occurredAt: timestamp.toISOString(),
  doseIndex: 0,
};

describe("Mood Day V2 medications and dose events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a PRN dose index and requires one for scheduled doses", () => {
    expect(
      doseEventWriteSchema.safeParse({
        ...input,
        kind: "prn",
        doseIndex: 0,
      }).success,
    ).toBe(false);
    expect(
      doseEventWriteSchema.safeParse({
        ...input,
        kind: "taken",
        doseIndex: null,
      }).success,
    ).toBe(false);
    expect(createDoseEventSchema.safeParse(input).success).toBe(true);
  });

  it("adds only nullable civil-time context and upgrades the SQLCipher queue", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "prisma/migrations/20260823003000_med_intake_timezone/migration.sql",
      ),
      "utf8",
    );
    const localDatabase = fs.readFileSync(
      path.join(process.cwd(), "apps/mobile/src/lib/local-database.ts"),
      "utf8",
    );

    expect(migration).toContain('ADD COLUMN "timezone" TEXT');
    expect(migration).not.toMatch(/NOT NULL|DROP TABLE|DELETE FROM/iu);
    expect(localDatabase).toContain("pending_sync_operation_v4");
    expect(localDatabase).toContain("'dose_event'");
    expect(localDatabase).toContain("PRAGMA user_version = 4");
  });

  it("lists only the authenticated user's active treatments", async () => {
    vi.mocked(prisma.medication.findMany).mockResolvedValue([]);

    await expect(
      listMedications({ userId: "user-1", cursor: "medication-before" }),
    ).resolves.toEqual({ items: [], nextCursor: null });
    expect(prisma.medication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isArchived: false },
        cursor: { id: "medication-before" },
        skip: 1,
      }),
    );
  });

  it("keeps the requested civil date for legacy events without stored timezone", async () => {
    vi.mocked(prisma.medIntake.findMany).mockResolvedValue([
      {
        ...selectedEvent,
        takenAt: new Date("2026-08-22T22:30:00.000Z"),
        scheduledForDate: null,
        timezone: null,
      },
    ] as never);

    await expect(
      listDoseEvents({
        userId: "user-1",
        localDate: "2026-08-23",
        timezone: "Europe/Paris",
      }),
    ).resolves.toMatchObject([
      { localDate: "2026-08-23", timezone: "Europe/Paris" },
    ]);
    expect(prisma.medIntake.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ medication: { userId: "user-1" } }),
      }),
    );
  });

  it("records a scheduled dose and decrements available stock atomically", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medIntake.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({
      id: "medication-1",
      isPRN: false,
      unitsPerDose: 1,
      stockQuantity: 12,
    } as never);
    vi.mocked(prisma.medIntake.create).mockResolvedValue(
      selectedEvent as never,
    );
    vi.mocked(prisma.medication.update).mockResolvedValue({} as never);
    vi.mocked(prisma.medicationInventoryEvent.create).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(createDoseEvent("user-1", input)).resolves.toMatchObject({
      id: "dose-event-1",
      kind: "taken",
      localDate: "2026-08-23",
      timezone: "Europe/Paris",
    });
    expect(prisma.medIntake.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          doseKey: "medication-1:2026-08-23:0",
          clientOperationId: "operation-dose-1",
          timezone: "Europe/Paris",
        }),
      }),
    );
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: "medication-1" },
      data: { stockQuantity: { decrement: 1 } },
    });
    const receipt = vi.mocked(prisma.syncOperation.create).mock.calls[0]?.[0]
      ?.data;
    expect(receipt).toMatchObject({
      userId: "user-1",
      operationId: "operation-dose-1",
      entityType: "dose_event",
      entityId: "dose-event-1",
      status: "applied",
    });
    expect(receipt.payloadDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("replays the same operation but rejects a second event for one scheduled slot", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValueOnce({
      entityType: "dose_event",
      entityId: "dose-event-1",
    } as never);
    vi.mocked(prisma.medIntake.findFirst).mockResolvedValue(
      selectedEvent as never,
    );

    await expect(createDoseEvent("user-1", input)).resolves.toMatchObject({
      id: "dose-event-1",
    });
    expect(prisma.medIntake.create).not.toHaveBeenCalled();

    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.medIntake.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ createdAt: timestamp } as never);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({
      id: "medication-1",
      isPRN: false,
      unitsPerDose: null,
      stockQuantity: null,
    } as never);

    await expect(
      createDoseEvent("user-1", {
        ...input,
        operationId: "operation-dose-2",
        entityId: "dose-event-2",
      }),
    ).rejects.toMatchObject({
      code: "scheduled_dose_exists",
      currentVersion: timestamp,
    });
    expect(prisma.medIntake.create).not.toHaveBeenCalled();
  });
});

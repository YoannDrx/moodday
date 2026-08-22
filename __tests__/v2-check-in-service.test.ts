import { prisma } from "@/lib/prisma";
import { createCheckIn, listCheckIns } from "@/features/v2/check-ins/service";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createdAt = new Date("2026-08-21T08:00:00.000Z");
const selected = {
  id: "check-in-1",
  operationId: "operation-1",
  depth: "quick" as const,
  localDate: "2026-08-21",
  timezone: "Europe/Paris",
  valence: 0,
  activation: 2,
  irritability: 10,
  anxiety: null,
  contexts: [],
  note: null,
  createdAt,
  updatedAt: createdAt,
};

describe("V2 check-in service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the user-scoped operation id and preserves zero values", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.checkIn.upsert).mockResolvedValue(selected as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(
      createCheckIn("user-1", {
        operationId: "operation-1",
        depth: "quick",
        localDate: "2026-08-21",
        timezone: "Europe/Paris",
        valence: 0,
        activation: 2,
        irritability: 10,
        contexts: [],
      }),
    ).resolves.toMatchObject({
      valence: 0,
      createdAt: "2026-08-21T08:00:00.000Z",
    });

    expect(prisma.checkIn.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_operationId: {
            userId: "user-1",
            operationId: "operation-1",
          },
        },
        update: {},
        create: expect.objectContaining({ userId: "user-1", valence: 0 }),
      }),
    );
    expect(prisma.syncOperation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        operationId: "operation-1",
        entityType: "check_in",
        entityId: "check-in-1",
        status: "applied",
      }),
    });
  });

  it("returns a stable cursor without exposing another user's rows", async () => {
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([
      selected,
      { ...selected, id: "check-in-2", operationId: "operation-2" },
      { ...selected, id: "check-in-3", operationId: "operation-3" },
    ] as never);

    await expect(
      listCheckIns({ userId: "user-1", cursor: "previous", limit: 2 }),
    ).resolves.toMatchObject({
      items: [{ id: "check-in-1" }, { id: "check-in-2" }],
      nextCursor: "check-in-2",
    });
    expect(prisma.checkIn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        cursor: { id: "previous" },
        skip: 1,
        take: 3,
      }),
    );
  });
});

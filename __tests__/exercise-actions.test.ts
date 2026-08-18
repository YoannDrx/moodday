import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));

import {
  archiveExercise,
  createExercise,
  deleteExerciseLog,
  getExerciseById,
  getExerciseHistory,
  getExercises,
  logExerciseCompletion,
  unarchiveExercise,
  updateExercise,
} from "@/features/exercise/exercise.action";

const user = { id: "user-1", email: "user@moodday.invalid" };
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

describe("exercise actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
  });

  it("creates, updates, archives and restores owned exercises", async () => {
    vi.mocked(prisma.exercise.create).mockResolvedValue({
      id: "exercise-1",
    } as never);
    await invoke(createExercise, {
      name: "Respiration",
      description: "Quatre minutes",
    });
    expect(prisma.exercise.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        syncStatus: "synced",
      }),
    });

    vi.mocked(prisma.exercise.findUnique).mockResolvedValue({
      userId: user.id,
    } as never);
    vi.mocked(prisma.exercise.update).mockResolvedValue({
      id: "exercise-1",
    } as never);
    await invoke(updateExercise, {
      id: "exercise-1",
      name: "Respiration lente",
      description: null,
    });
    await invoke(archiveExercise, { id: "exercise-1" });
    await invoke(unarchiveExercise, { id: "exercise-1" });

    expect(prisma.exercise.update).toHaveBeenNthCalledWith(2, {
      where: { id: "exercise-1" },
      data: { isArchived: true },
    });
    expect(prisma.exercise.update).toHaveBeenNthCalledWith(3, {
      where: { id: "exercise-1" },
      data: { isArchived: false },
    });
  });

  it.each([
    [updateExercise, { id: "exercise-1", name: "X" }, "edit"],
    [archiveExercise, { id: "exercise-1" }, "archive"],
    [unarchiveExercise, { id: "exercise-1" }, "unarchive"],
  ])("rejects cross-account %s operations", async (handler, input, verb) => {
    vi.mocked(prisma.exercise.findUnique).mockResolvedValue({
      userId: "another-user",
    } as never);
    await expect(invoke(handler, input)).rejects.toThrow(
      `You can only ${verb} your own exercises`,
    );
  });

  it("rejects operations on missing exercises", async () => {
    vi.mocked(prisma.exercise.findUnique).mockResolvedValue(null);
    await expect(
      invoke(updateExercise, { id: "missing", name: "X" }),
    ).rejects.toThrow("Exercise not found");
    await expect(invoke(archiveExercise, { id: "missing" })).rejects.toThrow(
      "Exercise not found",
    );
    await expect(invoke(unarchiveExercise, { id: "missing" })).rejects.toThrow(
      "Exercise not found",
    );
  });

  it("lists current exercises and reads an owned detail", async () => {
    vi.mocked(prisma.exercise.findMany).mockResolvedValue([
      { id: "exercise-1", logs: [] },
    ] as never);
    await invoke(getExercises, { includeArchived: false });
    expect(prisma.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: user.id, isArchived: false },
        include: {
          logs: expect.objectContaining({
            where: {
              completedAt: { gte: expect.any(Date), lt: expect.any(Date) },
            },
          }),
        },
      }),
    );

    await invoke(getExercises, { includeArchived: true });
    expect(prisma.exercise.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: user.id } }),
    );

    vi.mocked(prisma.exercise.findUnique).mockResolvedValue({
      id: "exercise-1",
      userId: user.id,
    } as never);
    await expect(
      invoke(getExerciseById, { id: "exercise-1" }),
    ).resolves.toEqual(expect.objectContaining({ id: "exercise-1" }));
  });

  it("rejects missing and cross-account detail reads", async () => {
    vi.mocked(prisma.exercise.findUnique).mockResolvedValueOnce(null);
    await expect(invoke(getExerciseById, { id: "missing" })).rejects.toThrow(
      "Exercise not found",
    );
    vi.mocked(prisma.exercise.findUnique).mockResolvedValueOnce({
      userId: "another-user",
    } as never);
    await expect(invoke(getExerciseById, { id: "exercise-1" })).rejects.toThrow(
      "view your own exercises",
    );
  });

  it("creates online logs and idempotently upserts offline logs", async () => {
    vi.mocked(prisma.exercise.findUnique).mockResolvedValue({
      userId: user.id,
    } as never);
    vi.mocked(prisma.exerciseLog.create).mockResolvedValue({
      id: "log-1",
    } as never);
    await invoke(logExerciseCompletion, {
      exerciseId: "exercise-1",
      note: "Fait",
    });
    expect(prisma.exerciseLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        exerciseId: "exercise-1",
        clientOperationId: null,
      }),
    });

    vi.mocked(prisma.exerciseLog.upsert).mockResolvedValue({
      id: "log-2",
    } as never);
    await invoke(logExerciseCompletion, {
      exerciseId: "exercise-1",
      operationId: "operation-1",
      completedAt: "2026-08-12T09:00:00.000Z",
    });
    expect(prisma.exerciseLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          exerciseId_clientOperationId: {
            exerciseId: "exercise-1",
            clientOperationId: "operation-1",
          },
        },
        update: {},
      }),
    );
  });

  it("protects log creation and deletion ownership", async () => {
    vi.mocked(prisma.exercise.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(logExerciseCompletion, { exerciseId: "missing" }),
    ).rejects.toThrow("Exercise not found");
    vi.mocked(prisma.exercise.findUnique).mockResolvedValueOnce({
      userId: "another-user",
    } as never);
    await expect(
      invoke(logExerciseCompletion, { exerciseId: "exercise-1" }),
    ).rejects.toThrow("log your own exercises");

    vi.mocked(prisma.exerciseLog.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(deleteExerciseLog, { logId: "missing" }),
    ).rejects.toThrow("Log not found");
    vi.mocked(prisma.exerciseLog.findUnique).mockResolvedValueOnce({
      exercise: { userId: "another-user" },
    } as never);
    await expect(invoke(deleteExerciseLog, { logId: "log-1" })).rejects.toThrow(
      "delete your own exercise logs",
    );
  });

  it("deletes an owned log and returns bounded history", async () => {
    vi.mocked(prisma.exerciseLog.findUnique).mockResolvedValue({
      exercise: { userId: user.id },
    } as never);
    vi.mocked(prisma.exerciseLog.delete).mockResolvedValue({} as never);
    await expect(
      invoke(deleteExerciseLog, { logId: "log-1" }),
    ).resolves.toEqual({ success: true });

    vi.mocked(prisma.exercise.findUnique).mockResolvedValue({
      userId: user.id,
    } as never);
    vi.mocked(prisma.exerciseLog.findMany).mockResolvedValue([
      { id: "log-1" },
    ] as never);
    await invoke(getExerciseHistory, { exerciseId: "exercise-1", days: 30 });
    expect(prisma.exerciseLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          exerciseId: "exercise-1",
          completedAt: { gte: expect.any(Date), lt: expect.any(Date) },
        },
      }),
    );
  });

  it("protects history ownership and missing resources", async () => {
    vi.mocked(prisma.exercise.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(getExerciseHistory, { exerciseId: "missing", days: 30 }),
    ).rejects.toThrow("Exercise not found");
    vi.mocked(prisma.exercise.findUnique).mockResolvedValueOnce({
      userId: "another-user",
    } as never);
    await expect(
      invoke(getExerciseHistory, { exerciseId: "exercise-1", days: 30 }),
    ).rejects.toThrow("view your own exercise history");
  });
});

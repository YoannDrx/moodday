import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addOfflineOperation: vi.fn(),
  countOfflineOperations: vi.fn(),
  getOfflineErrorCategory: vi.fn(),
  getOfflineFailureStatus: vi.fn(),
  getOfflineRetryDelay: vi.fn(),
  getSafeOfflineTimeZone: vi.fn(),
  isOfflineOperationDue: vi.fn(),
  listOfflineOperations: vi.fn(),
  removeOfflineOperation: vi.fn(),
  updateOfflineOperation: vi.fn(),
  notifyOfflineQueueChanged: vi.fn(),
  logMedIntake: vi.fn(),
  logPRNIntake: vi.fn(),
  skipMedIntake: vi.fn(),
  logExerciseCompletion: vi.fn(),
  createTherapySession: vi.fn(),
}));

vi.mock("nanoid", () => ({ nanoid: () => "offline-id" }));
vi.mock("@/features/medication/medication.action", () => ({
  logMedIntake: mocks.logMedIntake,
  logPRNIntake: mocks.logPRNIntake,
  skipMedIntake: mocks.skipMedIntake,
}));
vi.mock("@/features/exercise/exercise.action", () => ({
  logExerciseCompletion: mocks.logExerciseCompletion,
}));
vi.mock("@/features/therapy/therapy.action", () => ({
  createTherapySession: mocks.createTherapySession,
}));
vi.mock("@/features/pwa/offline-events", () => ({
  notifyOfflineQueueChanged: mocks.notifyOfflineQueueChanged,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  addOfflineOperation: mocks.addOfflineOperation,
  countOfflineOperations: mocks.countOfflineOperations,
  getOfflineErrorCategory: mocks.getOfflineErrorCategory,
  getOfflineFailureStatus: mocks.getOfflineFailureStatus,
  getOfflineRetryDelay: mocks.getOfflineRetryDelay,
  getSafeOfflineTimeZone: mocks.getSafeOfflineTimeZone,
  isOfflineOperationDue: mocks.isOfflineOperationDue,
  listOfflineOperations: mocks.listOfflineOperations,
  removeOfflineOperation: mocks.removeOfflineOperation,
  updateOfflineOperation: mocks.updateOfflineOperation,
}));

import {
  getQueuedActionCount,
  getQueuedActions,
  queueAction,
  syncQueuedActions,
  type OfflineActionPayload,
} from "@/features/pwa/offline-actions";

const ownerId = "offline-owner";
const createdAt = new Date("2026-08-18T08:30:00.000Z");

const operation = (
  payload: OfflineActionPayload,
  overrides: Record<string, unknown> = {},
) => ({
  id: `action:${payload.type}`,
  ownerId,
  schemaVersion: 2,
  kind: "action",
  payload,
  status: "pending",
  retryCount: 0,
  createdAt: createdAt.toISOString(),
  updatedAt: createdAt.toISOString(),
  localDateAtCreation: "2026-08-18",
  timeZoneAtCreation: "Europe/Paris",
  ...overrides,
});

describe("offline actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSafeOfflineTimeZone.mockReturnValue("Europe/Paris");
    mocks.isOfflineOperationDue.mockReturnValue(true);
    mocks.getOfflineFailureStatus.mockReturnValue("failed");
    mocks.getOfflineErrorCategory.mockReturnValue("transient");
    mocks.getOfflineRetryDelay.mockReturnValue(1_000);
    mocks.countOfflineOperations.mockResolvedValue(2);
    mocks.listOfflineOperations.mockResolvedValue([]);
    mocks.logMedIntake.mockResolvedValue({});
    mocks.skipMedIntake.mockResolvedValue({});
    mocks.logPRNIntake.mockResolvedValue({});
    mocks.logExerciseCompletion.mockResolvedValue({});
    mocks.createTherapySession.mockResolvedValue({});
  });

  it.each([
    [
      { type: "med_intake", medicationId: "med-1" },
      {
        type: "med_intake",
        medicationId: "med-1",
        takenAt: createdAt.toISOString(),
        scheduledForDate: "2026-08-18",
      },
    ],
    [
      {
        type: "med_skip",
        medicationId: "med-1",
        takenAt: "2026-08-17T12:00:00.000Z",
        scheduledForDate: "2026-08-17",
      },
      {
        type: "med_skip",
        medicationId: "med-1",
        takenAt: "2026-08-17T12:00:00.000Z",
        scheduledForDate: "2026-08-17",
      },
    ],
    [
      { type: "med_prn_intake", medicationId: "med-2" },
      {
        type: "med_prn_intake",
        medicationId: "med-2",
        takenAt: createdAt.toISOString(),
      },
    ],
    [
      {
        type: "med_prn_intake",
        medicationId: "med-2",
        takenAt: "2026-08-17T12:00:00.000Z",
      },
      {
        type: "med_prn_intake",
        medicationId: "med-2",
        takenAt: "2026-08-17T12:00:00.000Z",
      },
    ],
    [
      { type: "exercise_log", exerciseId: "exercise-1" },
      {
        type: "exercise_log",
        exerciseId: "exercise-1",
        completedAt: createdAt.toISOString(),
      },
    ],
    [
      {
        type: "exercise_log",
        exerciseId: "exercise-1",
        completedAt: "2026-08-17T12:00:00.000Z",
      },
      {
        type: "exercise_log",
        exerciseId: "exercise-1",
        completedAt: "2026-08-17T12:00:00.000Z",
      },
    ],
    [
      { type: "therapy_create", date: "2026-08-18", notes: "Notes" },
      { type: "therapy_create", date: "2026-08-18", notes: "Notes" },
    ],
  ] as const)("preserves creation time for %j", async (payload, expected) => {
    const entry = await queueAction(ownerId, payload, {
      createdAt,
      timeZone: "Europe/Paris",
      expectedVersion: "resource-v1",
    });

    expect(entry).toMatchObject({
      id: "action:offline-id",
      ownerId,
      payload: expected,
      localDateAtCreation: "2026-08-18",
      timeZoneAtCreation: "Europe/Paris",
    });
    expect(mocks.addOfflineOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedVersion: "resource-v1",
        status: "pending",
      }),
    );
    expect(mocks.notifyOfflineQueueChanged).toHaveBeenCalledTimes(1);
  });

  it("uses safe defaults and exposes bounded queue readers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(createdAt);
    await queueAction(ownerId, {
      type: "therapy_create",
      date: "2026-08-18",
      notes: "Notes",
    });
    await expect(getQueuedActionCount(ownerId)).resolves.toBe(2);
    await expect(getQueuedActions(ownerId)).resolves.toEqual([]);
    expect(mocks.getSafeOfflineTimeZone).toHaveBeenCalledWith(undefined);
    expect(mocks.countOfflineOperations).toHaveBeenCalledWith(
      ownerId,
      "action",
    );
    vi.useRealTimers();
  });

  it("synchronizes every supported action and removes successful entries", async () => {
    const queue = [
      operation({
        type: "med_intake",
        medicationId: "med-1",
        doseIndex: 1,
        scheduledForDate: "2026-08-18",
        takenAt: createdAt.toISOString(),
      }),
      operation({
        type: "med_skip",
        medicationId: "med-2",
        reason: "Skipped",
      }),
      operation({
        type: "med_prn_intake",
        medicationId: "med-3",
        reason: "As needed",
      }),
      operation({
        type: "exercise_log",
        exerciseId: "exercise-1",
        note: "Done",
      }),
      operation({
        type: "therapy_create",
        date: "2026-08-18",
        notes: "Session",
        benefitRating: 0,
      }),
    ];
    mocks.listOfflineOperations
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);

    await expect(syncQueuedActions(ownerId)).resolves.toEqual({
      synced: 5,
      remaining: 0,
      conflicts: 0,
    });
    expect(mocks.logMedIntake).toHaveBeenCalledWith(
      expect.objectContaining({ operationId: "action:med_intake" }),
    );
    expect(mocks.skipMedIntake).toHaveBeenCalledTimes(1);
    expect(mocks.logPRNIntake).toHaveBeenCalledTimes(1);
    expect(mocks.logExerciseCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.createTherapySession).toHaveBeenCalledWith(
      expect.objectContaining({ benefitRating: 0 }),
    );
    expect(mocks.removeOfflineOperation).toHaveBeenCalledTimes(5);
  });

  it("skips conflicts and operations whose retry is not due", async () => {
    const conflict = operation(
      { type: "med_intake", medicationId: "med-1" },
      { status: "conflict" },
    );
    const delayed = operation({ type: "med_skip", medicationId: "med-2" });
    mocks.isOfflineOperationDue.mockImplementation((item) => item !== delayed);
    mocks.listOfflineOperations
      .mockResolvedValueOnce([conflict, delayed])
      .mockResolvedValueOnce([conflict, delayed]);

    await expect(syncQueuedActions(ownerId)).resolves.toEqual({
      synced: 0,
      remaining: 2,
      conflicts: 1,
    });
    expect(mocks.updateOfflineOperation).not.toHaveBeenCalled();
  });

  it.each([
    ["med_intake", mocks.logMedIntake],
    ["med_skip", mocks.skipMedIntake],
    ["med_prn_intake", mocks.logPRNIntake],
    ["exercise_log", mocks.logExerciseCompletion],
    ["therapy_create", mocks.createTherapySession],
  ] as const)("captures a %s server error for retry", async (type, action) => {
    const payloads: Record<string, OfflineActionPayload> = {
      med_intake: { type: "med_intake", medicationId: "med-1" },
      med_skip: { type: "med_skip", medicationId: "med-1" },
      med_prn_intake: { type: "med_prn_intake", medicationId: "med-1" },
      exercise_log: { type: "exercise_log", exerciseId: "exercise-1" },
      therapy_create: {
        type: "therapy_create",
        date: "2026-08-18",
        notes: "Notes",
      },
    };
    const item = operation(payloads[type]);
    action.mockResolvedValueOnce({ serverError: `${type} unavailable` });
    mocks.listOfflineOperations
      .mockResolvedValueOnce([item])
      .mockResolvedValueOnce([item]);

    await expect(syncQueuedActions(`${ownerId}-${type}`)).resolves.toEqual({
      synced: 0,
      remaining: 1,
      conflicts: 0,
    });
    expect(mocks.updateOfflineOperation).toHaveBeenLastCalledWith(
      `${ownerId}-${type}`,
      item.id,
      expect.objectContaining({
        status: "failed",
        retryCount: 1,
        errorCategory: "transient",
        nextAttemptAt: expect.any(String),
      }),
    );
  });

  it("turns permanent ownership failures into conflicts without retry dates", async () => {
    const item = operation({ type: "med_intake", medicationId: "med-1" });
    mocks.logMedIntake.mockRejectedValueOnce("ownership mismatch");
    mocks.getOfflineFailureStatus.mockReturnValueOnce("conflict");
    mocks.listOfflineOperations
      .mockResolvedValueOnce([item])
      .mockResolvedValueOnce([{ ...item, status: "conflict" }]);

    await expect(syncQueuedActions("other-owner")).resolves.toEqual({
      synced: 0,
      remaining: 1,
      conflicts: 1,
    });
    expect(mocks.updateOfflineOperation).toHaveBeenLastCalledWith(
      "other-owner",
      item.id,
      expect.objectContaining({
        status: "conflict",
        lastError: "Offline synchronization failed",
        nextAttemptAt: undefined,
      }),
    );
  });

  it("rejects unknown queued payloads safely", async () => {
    const item = operation({
      type: "unknown",
    } as unknown as OfflineActionPayload);
    mocks.listOfflineOperations
      .mockResolvedValueOnce([item])
      .mockResolvedValueOnce([item]);

    await expect(syncQueuedActions("unknown-owner")).resolves.toEqual({
      synced: 0,
      remaining: 1,
      conflicts: 0,
    });
    expect(mocks.updateOfflineOperation).toHaveBeenLastCalledWith(
      "unknown-owner",
      item.id,
      expect.objectContaining({ lastError: "Unknown offline action" }),
    );
  });

  it("deduplicates concurrent synchronization for the same owner", async () => {
    let release: ((value: unknown[]) => void) | undefined;
    mocks.listOfflineOperations.mockImplementationOnce(
      async () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    const first = syncQueuedActions("concurrent-owner");
    const second = syncQueuedActions("concurrent-owner");
    release?.([]);

    await expect(Promise.all([first, second])).resolves.toEqual([
      { synced: 0, remaining: 0, conflicts: 0 },
      { synced: 0, remaining: 0, conflicts: 0 },
    ]);
    expect(mocks.listOfflineOperations).toHaveBeenCalledTimes(1);
  });
});

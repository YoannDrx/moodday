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
  saveCheckInAction: vi.fn(),
}));

vi.mock("nanoid", () => ({ nanoid: () => "offline-id" }));
vi.mock("@/features/couple/couple.action", () => ({
  saveCheckInAction: mocks.saveCheckInAction,
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
  queueAction,
  syncQueuedActions,
  type OfflineActionPayload,
} from "@/features/pwa/offline-actions";

const ownerId = "offline-owner";
const createdAt = new Date("2026-10-30T21:30:00.000Z");
const payload: OfflineActionPayload = {
  type: "check_in",
  localDate: "2026-10-30",
  timezone: "Europe/Paris",
  state: "fragile",
  symptoms: ["fatigue"],
  needs: ["calm"],
  privateNote: "rien que pour moi",
};

const operation = (overrides: Record<string, unknown> = {}) => ({
  id: "action:offline-id",
  ownerId,
  schemaVersion: 2,
  kind: "action",
  payload,
  status: "pending",
  retryCount: 0,
  createdAt: createdAt.toISOString(),
  updatedAt: createdAt.toISOString(),
  ...overrides,
});

describe("offline check-in queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSafeOfflineTimeZone.mockImplementation(
      (timeZone?: string) => timeZone ?? "Europe/Paris",
    );
    mocks.isOfflineOperationDue.mockReturnValue(true);
    mocks.getOfflineFailureStatus.mockReturnValue("failed");
    mocks.getOfflineErrorCategory.mockReturnValue("network");
    mocks.getOfflineRetryDelay.mockReturnValue(60_000);
  });

  it("stores the check-in with the civil date of its creation", async () => {
    const entry = await queueAction(ownerId, payload, {
      createdAt,
      timeZone: "Europe/Paris",
    });

    expect(entry.localDateAtCreation).toBe("2026-10-30");
    expect(mocks.addOfflineOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "action:offline-id",
        kind: "action",
        status: "pending",
        payload,
      }),
    );
    expect(mocks.notifyOfflineQueueChanged).toHaveBeenCalled();
  });

  it("replays the check-in with its queue id as the idempotency key", async () => {
    mocks.listOfflineOperations
      .mockResolvedValueOnce([operation()])
      .mockResolvedValueOnce([]);
    mocks.saveCheckInAction.mockResolvedValue({ data: { id: "check-1" } });

    await expect(syncQueuedActions(ownerId)).resolves.toEqual({
      synced: 1,
      remaining: 0,
      conflicts: 0,
    });
    expect(mocks.saveCheckInAction).toHaveBeenCalledWith({
      operationId: "action:offline-id",
      localDate: "2026-10-30",
      timezone: "Europe/Paris",
      state: "fragile",
      symptoms: ["fatigue"],
      needs: ["calm"],
      privateNote: "rien que pour moi",
    });
    expect(mocks.removeOfflineOperation).toHaveBeenCalledWith(
      ownerId,
      "action:offline-id",
    );
  });

  it("keeps a rejected check-in for retry instead of dropping it", async () => {
    mocks.listOfflineOperations
      .mockResolvedValueOnce([operation()])
      .mockResolvedValueOnce([operation({ status: "failed" })]);
    mocks.saveCheckInAction.mockResolvedValue({ serverError: "network down" });

    const result = await syncQueuedActions(ownerId);

    expect(result).toEqual({ synced: 0, remaining: 1, conflicts: 0 });
    expect(mocks.removeOfflineOperation).not.toHaveBeenCalled();
    expect(mocks.updateOfflineOperation).toHaveBeenLastCalledWith(
      ownerId,
      "action:offline-id",
      expect.objectContaining({
        status: "failed",
        retryCount: 1,
        lastError: "network down",
        nextAttemptAt: expect.any(String),
      }),
    );
  });

  it("skips conflicts and operations that are not due yet", async () => {
    mocks.listOfflineOperations
      .mockResolvedValueOnce([operation({ status: "conflict" })])
      .mockResolvedValueOnce([operation({ status: "conflict" })]);

    await expect(syncQueuedActions(ownerId)).resolves.toEqual({
      synced: 0,
      remaining: 1,
      conflicts: 1,
    });
    expect(mocks.saveCheckInAction).not.toHaveBeenCalled();
  });

  it("counts queued check-ins per owner", async () => {
    mocks.countOfflineOperations.mockResolvedValue(2);
    await expect(getQueuedActionCount(ownerId)).resolves.toBe(2);
    expect(mocks.countOfflineOperations).toHaveBeenCalledWith(
      ownerId,
      "action",
    );
  });
});

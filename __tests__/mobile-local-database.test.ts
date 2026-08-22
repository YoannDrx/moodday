import type { SyncPushOperation, SyncPushResult } from "@moodday/contracts";
import { describe, expect, it, vi } from "vitest";
import {
  createLocalOperationSummary,
  createOwnerStorageIdentity,
  getSessionOwnerTransition,
  normalizeLocalOwnerId,
  persistOperationBeforeSync,
} from "../apps/mobile/src/lib/local-database-core";

const operation: SyncPushOperation = {
  operationId: "operation-mobile-1",
  entityId: "check-in-mobile-1",
  entityType: "check_in",
  mutation: "create",
  payload: {
    operationId: "operation-mobile-1",
    depth: "presence",
    localDate: "2026-08-22",
    timezone: "Europe/Paris",
    contexts: [],
  },
};

const createAdapters = () => ({
  markRejected: vi.fn(async () => undefined),
  push: vi.fn<() => Promise<SyncPushResult>>(async () => ({
    results: [
      {
        operationId: operation.operationId,
        status: "applied",
        entityId: operation.entityId,
        code: null,
        currentVersion: null,
      },
    ],
  })),
  queue: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
});

describe("mobile owner-bound local database", () => {
  it("derives pseudonymous SQLCipher database and key references", () => {
    const first = createOwnerStorageIdentity("a".repeat(64));
    const second = createOwnerStorageIdentity("b".repeat(64));

    expect(first).toEqual({
      databaseName: `moodday-v2-${"a".repeat(32)}.db`,
      keyReference: `moodday.database-key.v2.${"a".repeat(64)}`,
    });
    expect(second.databaseName).not.toBe(first.databaseName);
    expect(createOwnerStorageIdentity("A".repeat(64))).toEqual(first);
    expect(() => createOwnerStorageIdentity("user-alpha")).toThrow(
      "local_database_owner_hash_invalid",
    );
    expect(normalizeLocalOwnerId(" user-alpha ")).toBe("user-alpha");
    expect(() => normalizeLocalOwnerId("   ")).toThrow(
      "local_database_owner_required",
    );
  });

  it("counts every unresolved local operation before sign-out", () => {
    expect(
      createLocalOperationSummary([
        { state: "pending", count: 2 },
        { state: "conflict", count: 1 },
        { state: "rejected", count: 1 },
      ]),
    ).toEqual({ pending: 2, conflict: 1, rejected: 1, total: 4 });
    expect(createLocalOperationSummary([])).toEqual({
      pending: 0,
      conflict: 0,
      rejected: 0,
      total: 0,
    });
    expect(() =>
      createLocalOperationSummary([{ state: "pending", count: -1 }]),
    ).toThrow("local_operation_count_invalid");
  });

  it("locks the previous owner on revocation or account replacement", () => {
    expect(
      getSessionOwnerTransition({
        currentOwnerId: undefined,
        isPending: false,
        previousOwnerId: "user-alpha",
      }),
    ).toBe("lock");
    expect(
      getSessionOwnerTransition({
        currentOwnerId: "user-beta",
        isPending: false,
        previousOwnerId: "user-alpha",
      }),
    ).toBe("lock");
    expect(
      getSessionOwnerTransition({
        currentOwnerId: undefined,
        isPending: true,
        previousOwnerId: "user-alpha",
      }),
    ).toBe("none");
    expect(
      getSessionOwnerTransition({
        currentOwnerId: "user-alpha",
        isPending: false,
        previousOwnerId: undefined,
      }),
    ).toBe("adopt");
  });

  it("persists before sending and removes only after server acceptance", async () => {
    const calls: string[] = [];
    const adapters = createAdapters();
    adapters.queue.mockImplementationOnce(async () => {
      calls.push("queue");
    });
    adapters.push.mockImplementationOnce(async () => {
      calls.push("push");
      return {
        results: [
          {
            operationId: operation.operationId,
            status: "duplicate",
            entityId: operation.entityId,
            code: null,
            currentVersion: null,
          },
        ],
      };
    });
    adapters.remove.mockImplementationOnce(async () => {
      calls.push("remove");
    });

    await expect(
      persistOperationBeforeSync(operation, adapters),
    ).resolves.toEqual({ pending: false, entityId: operation.entityId });
    expect(calls).toEqual(["queue", "push", "remove"]);
    expect(adapters.markRejected).not.toHaveBeenCalled();
  });

  it("keeps the encrypted operation after a recoverable outage", async () => {
    const adapters = createAdapters();
    adapters.push.mockRejectedValueOnce(new Error("network_unavailable"));

    await expect(
      persistOperationBeforeSync(operation, adapters),
    ).resolves.toEqual({ pending: true, entityId: operation.entityId });
    expect(adapters.queue).toHaveBeenCalledOnce();
    expect(adapters.remove).not.toHaveBeenCalled();
    expect(adapters.markRejected).not.toHaveBeenCalled();
  });

  it("removes data when the server reports a revoked session", async () => {
    const adapters = createAdapters();
    const authError = Object.assign(new Error("Authentication required"), {
      code: "authentication_required",
      recoverable: false,
      requestId: "request-1",
    });
    adapters.push.mockRejectedValueOnce(authError);

    await expect(persistOperationBeforeSync(operation, adapters)).rejects.toBe(
      authError,
    );
    expect(adapters.queue).toHaveBeenCalledOnce();
    expect(adapters.remove).toHaveBeenCalledOnce();
  });

  it("marks an explicit server rejection without retrying it forever", async () => {
    const adapters = createAdapters();
    adapters.push.mockResolvedValueOnce({
      results: [
        {
          operationId: operation.operationId,
          status: "rejected",
          code: "invalid_payload",
          entityId: operation.entityId,
          currentVersion: null,
        },
      ],
    });

    await expect(
      persistOperationBeforeSync(operation, adapters),
    ).rejects.toThrow("invalid_payload");
    expect(adapters.markRejected).toHaveBeenCalledWith("invalid_payload");
    expect(adapters.remove).not.toHaveBeenCalled();
  });
});

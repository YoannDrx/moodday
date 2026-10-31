import "fake-indexeddb/auto";

import {
  addOfflineOperation,
  clearOfflineOperations,
  closeOfflineDatabase,
  compactOfflineOperations,
  countOfflineOperations,
  getOfflineErrorCategory,
  getOfflineFailureStatus,
  getOfflineRetryDelay,
  getActiveOfflineOwner,
  getEncryptedOfflineSnapshot,
  getOfflineStorageErrorMessage,
  getSafeOfflineTimeZone,
  isOfflineOperationDue,
  isOfflineStorageQuotaError,
  listOfflineOperations,
  mayHaveOfflineOperations,
  OfflineStorageQuotaError,
  purgeOfflineDataForOwner,
  removeOfflineOperation,
  retryOfflineOperation,
  saveEncryptedOfflineSnapshot,
  setActiveOfflineOwner,
  updateOfflineOperation,
} from "@/features/pwa/offline-store";
import { getQueuedActions, queueAction } from "@/features/pwa/offline-actions";
import type { OfflineActionPayload } from "@/features/pwa/offline-actions";

const checkIn = (
  state: "ok" | "fragile" | "hard" | "very_hard",
  localDate = "2026-07-01",
): OfflineActionPayload => ({
  type: "check_in",
  localDate,
  timezone: "Europe/Paris",
  state,
  symptoms: [],
  needs: [],
});
import { afterEach, describe, expect, it, vi } from "vitest";

const OWNER_ID = "user-alice";
const OTHER_OWNER_ID = "user-bob";
const REQUIRED_METADATA = {
  ownerId: OWNER_ID,
  schemaVersion: 2 as const,
  localDateAtCreation: "2026-07-16",
  timeZoneAtCreation: "Europe/Paris",
};

afterEach(async () => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  await clearOfflineOperations();
});

describe("offline IndexedDB store", () => {
  it("purges unowned v1 localStorage queues instead of assigning them", async () => {
    window.localStorage.setItem(
      "moodday.offline.actions",
      JSON.stringify([
        {
          id: "legacy-1",
          payload: { type: "exercise_log", exerciseId: "exercise-1" },
          createdAt: "2026-07-10T08:00:00.000Z",
        },
      ]),
    );

    const operations = await listOfflineOperations(OWNER_ID, "action");

    expect(operations).toEqual([]);
    expect(window.localStorage.getItem("moodday.offline.actions")).toBeNull();
  });

  it("validates owners and exposes only a synchronous pending marker", async () => {
    expect(mayHaveOfflineOperations(OWNER_ID)).toBe(false);

    const browserWindow = window;
    vi.stubGlobal("window", undefined);
    expect(mayHaveOfflineOperations(OWNER_ID)).toBe(true);
    vi.stubGlobal("window", browserWindow);

    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:marker",
      kind: "mood",
      payload: { value: 4 },
      status: "pending",
      retryCount: 0,
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z",
    });
    expect(mayHaveOfflineOperations(OWNER_ID)).toBe(true);

    await removeOfflineOperation(OWNER_ID, "mood:marker");
    expect(mayHaveOfflineOperations(OWNER_ID)).toBe(false);
    expect(() => mayHaveOfflineOperations("   ")).toThrow(
      "An offline queue owner is required",
    );
  });

  it("keeps owner helpers safe during server rendering", () => {
    const browserWindow = window;
    vi.stubGlobal("window", undefined);

    expect(() => setActiveOfflineOwner(OWNER_ID)).not.toThrow();
    expect(getActiveOfflineOwner()).toBeNull();

    vi.stubGlobal("window", browserWindow);
  });

  it("encrypts owner-bound offline snapshots and revokes access on account changes", async () => {
    const payload = {
      warningSigns: ["PRIVATE_SAFETY_SIGNAL"],
      trustedContacts: [{ name: "Camille", detail: "06 00 00 00 00" }],
    };

    await saveEncryptedOfflineSnapshot(OWNER_ID, "safety-plan", payload);
    expect(getActiveOfflineOwner()).toBe(OWNER_ID);
    expect(JSON.stringify(window.localStorage)).not.toContain(
      "PRIVATE_SAFETY_SIGNAL",
    );
    await expect(
      getEncryptedOfflineSnapshot(OWNER_ID, "safety-plan"),
    ).resolves.toEqual(payload);
    await expect(
      getEncryptedOfflineSnapshot(OTHER_OWNER_ID, "safety-plan"),
    ).resolves.toBeNull();

    setActiveOfflineOwner(OTHER_OWNER_ID);
    expect(getActiveOfflineOwner()).toBe(OTHER_OWNER_ID);
    await purgeOfflineDataForOwner(OWNER_ID);
    await expect(
      getEncryptedOfflineSnapshot(OWNER_ID, "safety-plan"),
    ).resolves.toBeNull();
  });

  it("rejects blank or mismatched encrypted snapshot metadata", async () => {
    await expect(
      saveEncryptedOfflineSnapshot(OWNER_ID, "   ", { value: 1 }),
    ).rejects.toThrow("An offline snapshot name is required");
    await expect(getEncryptedOfflineSnapshot(OWNER_ID, "   ")).rejects.toThrow(
      "An offline snapshot name is required",
    );

    const key = "moodday.offline.snapshot.v2.user-alice.safety-plan";
    const base = {
      ownerId: OWNER_ID,
      name: "safety-plan",
      schemaVersion: 2,
      ciphertext: "unused",
      iv: "unused",
      updatedAt: new Date().toISOString(),
    };
    const expectInvalidSnapshot = async (invalid: typeof base) => {
      window.localStorage.setItem(key, JSON.stringify(invalid));
      await expect(
        getEncryptedOfflineSnapshot(OWNER_ID, "safety-plan"),
      ).resolves.toBeNull();
    };
    await expectInvalidSnapshot({ ...base, ownerId: OTHER_OWNER_ID });
    await expectInvalidSnapshot({ ...base, name: "different" });
    await expectInvalidSnapshot({ ...base, schemaVersion: 1 });
  });

  it("classifies storage, synchronization and retry errors without leaking payloads", () => {
    const quota = new OfflineStorageQuotaError();
    expect(isOfflineStorageQuotaError(quota)).toBe(true);
    expect(isOfflineStorageQuotaError({ name: "QuotaExceededError" })).toBe(
      true,
    );
    expect(
      isOfflineStorageQuotaError({ name: "NS_ERROR_DOM_QUOTA_REACHED" }),
    ).toBe(true);
    expect(isOfflineStorageQuotaError({ code: 22 })).toBe(true);
    expect(isOfflineStorageQuotaError({ code: 1014 })).toBe(true);
    expect(isOfflineStorageQuotaError(null)).toBe(false);
    expect(
      getOfflineStorageErrorMessage(quota, {
        quota: "storage full",
        fallback: "unknown",
      }),
    ).toBe("storage full");
    expect(
      getOfflineStorageErrorMessage(new Error("network down"), {
        quota: "storage full",
        fallback: "unknown",
      }),
    ).toBe("network down");
    expect(
      getOfflineStorageErrorMessage("failure", {
        quota: "storage full",
        fallback: "unknown",
      }),
    ).toBe("unknown");

    expect(getOfflineFailureStatus("resource not found")).toBe("conflict");
    expect(getOfflineFailureStatus("temporary failure")).toBe("failed");
    expect(getOfflineErrorCategory("unauthorized owner")).toBe("authorization");
    expect(getOfflineErrorCategory("version conflict")).toBe("conflict");
    expect(getOfflineErrorCategory("network timeout")).toBe("network");
    expect(getOfflineErrorCategory("storage quota")).toBe("quota");
    expect(getOfflineErrorCategory("server 503 unavailable")).toBe("server");
    expect(getOfflineErrorCategory("unexpected condition")).toBe("unknown");
  });

  it("normalizes valid and invalid time zones", () => {
    expect(getSafeOfflineTimeZone("Europe/Paris")).toBe("Europe/Paris");
    expect(getSafeOfflineTimeZone("Invalid/Zone")).toBe("Europe/Paris");

    vi.stubGlobal("Intl", undefined);
    expect(getSafeOfflineTimeZone()).toBe("Europe/Paris");
  });

  it("fails explicitly when IndexedDB is unavailable", async () => {
    await closeOfflineDatabase();
    vi.stubGlobal("indexedDB", undefined);

    await expect(countOfflineOperations(OWNER_ID)).rejects.toThrow(
      "IndexedDB is unavailable",
    );
  });

  it("persists status, retry metadata and explicit retry decisions", async () => {
    const createdAt = "2026-07-16T10:00:00.000Z";
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:operation-1",
      kind: "mood",
      payload: { value: 6 },
      status: "pending",
      retryCount: 0,
      createdAt,
      updatedAt: createdAt,
    });

    await updateOfflineOperation(OWNER_ID, "mood:operation-1", {
      status: "conflict",
      retryCount: 2,
      lastError: "The server version changed",
      payload: { value: 8 },
    });

    expect(await countOfflineOperations(OWNER_ID, "mood")).toBe(1);
    expect(await listOfflineOperations(OWNER_ID, "mood")).toEqual([
      expect.objectContaining({
        status: "conflict",
        retryCount: 2,
        lastError: "The server version changed",
        payload: { value: 8 },
      }),
    ]);

    await retryOfflineOperation(OWNER_ID, "mood:operation-1");
    expect(await listOfflineOperations(OWNER_ID, "mood")).toEqual([
      expect.objectContaining({
        status: "pending",
        retryCount: 0,
        lastError: undefined,
      }),
    ]);

    await removeOfflineOperation(OWNER_ID, "mood:operation-1");
    expect(await countOfflineOperations(OWNER_ID)).toBe(0);
  });

  it("rejects missing and cross-owner updates and ignores cross-owner deletes", async () => {
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:owned",
      kind: "mood",
      payload: { value: 5 },
      status: "pending",
      retryCount: 0,
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z",
    });

    await expect(
      updateOfflineOperation(OTHER_OWNER_ID, "mood:owned", {
        status: "failed",
      }),
    ).rejects.toThrow("was not found");
    await expect(
      updateOfflineOperation(OWNER_ID, "mood:missing", {
        status: "failed",
      }),
    ).rejects.toThrow("was not found");

    await removeOfflineOperation(OTHER_OWNER_ID, "mood:owned");
    expect(await countOfflineOperations(OWNER_ID)).toBe(1);
  });

  it("durably queues a check-in", async () => {
    const entry = await queueAction(OWNER_ID, checkIn("fragile"));

    expect(entry.id).toMatch(/^action:/);
    expect(await getQueuedActions(OWNER_ID)).toEqual([
      expect.objectContaining({
        id: entry.id,
        kind: "action",
        status: "pending",
        retryCount: 0,
        payload: expect.objectContaining({ state: "fragile" }),
      }),
    ]);
  });

  it("can undo a queued check-in before synchronization", async () => {
    const entry = await queueAction(OWNER_ID, checkIn("ok"));

    await removeOfflineOperation(OWNER_ID, entry.id);

    expect(await getQueuedActions(OWNER_ID)).toEqual([]);
  });

  it("caps exponential retry delays at one hour", () => {
    expect(getOfflineRetryDelay(1)).toBe(30_000);
    expect(getOfflineRetryDelay(2)).toBe(60_000);
    expect(getOfflineRetryDelay(20)).toBe(3_600_000);
  });

  it("keeps seven daily check-ins after the database is closed and reopened", async () => {
    const firstDay = new Date("2026-07-01T08:00:00.000Z");

    const queuedDays = Array.from({ length: 7 }, async (_, day) => {
      const createdAt = new Date(
        firstDay.getTime() + day * 24 * 60 * 60 * 1000,
      );
      return queueAction(
        OWNER_ID,
        checkIn(
          day % 2 === 0 ? "ok" : "hard",
          createdAt.toISOString().slice(0, 10),
        ),
        { createdAt },
      );
    });
    await Promise.all(queuedDays);

    await closeOfflineDatabase();
    const reopenedQueue = await getQueuedActions(OWNER_ID);

    expect(reopenedQueue).toHaveLength(7);
    expect(new Set(reopenedQueue.map((operation) => operation.id)).size).toBe(
      7,
    );
    expect(
      reopenedQueue.map((operation) => operation.payload.localDate),
    ).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
      "2026-07-06",
      "2026-07-07",
    ]);
    expect(
      reopenedQueue.every((operation) => operation.status === "pending"),
    ).toBe(true);
  });

  it("keeps the creation time zone and civil date across a DST change", async () => {
    const createdAt = new Date("2026-03-28T23:30:00.000Z");
    const entry = await queueAction(
      OWNER_ID,
      checkIn("fragile", "2026-03-29"),
      {
        createdAt,
        timeZone: "Europe/Paris",
      },
    );

    const [operation] = await getQueuedActions(OWNER_ID);

    expect(operation).toMatchObject({
      id: entry.id,
      createdAt: createdAt.toISOString(),
      timeZoneAtCreation: "Europe/Paris",
      localDateAtCreation: "2026-03-29",
      payload: { localDate: "2026-03-29" },
    });
  });

  it("keeps queue order for several check-ins", async () => {
    const createdAt = new Date("2026-10-25T01:30:00.000Z");
    await queueAction(OWNER_ID, checkIn("ok", "2026-10-24"), { createdAt });
    await queueAction(OWNER_ID, checkIn("hard", "2026-10-25"), { createdAt });

    const operations = await getQueuedActions(OWNER_ID);
    expect(operations.map((operation) => operation.payload.state)).toEqual([
      "ok",
      "hard",
    ]);
    expect(operations.map((operation) => operation.queuePosition)).toEqual([
      1, 2,
    ]);
  });

  it("recovers a stale syncing operation after an interrupted tab", async () => {
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:interrupted",
      kind: "mood",
      payload: { value: 5 },
      status: "syncing",
      retryCount: 1,
      createdAt: "2026-07-16T09:00:00.000Z",
      updatedAt: "2026-07-16T09:01:00.000Z",
      lastError: "x".repeat(500),
    });

    const result = await compactOfflineOperations(OWNER_ID, {
      now: new Date("2026-07-16T10:00:00.000Z"),
    });

    expect(result).toEqual({
      scanned: 1,
      recovered: 1,
      normalizedErrors: 1,
      expiredOperations: 0,
      expiredSnapshots: 0,
    });
    expect(await listOfflineOperations(OWNER_ID, "mood")).toEqual([
      expect.objectContaining({
        status: "pending",
        retryCount: 1,
        lastError: undefined,
        nextAttemptAt: undefined,
      }),
    ]);
  });

  it("compacts oversized errors without recovering fresh operations", async () => {
    const now = new Date();
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:fresh",
      kind: "mood",
      payload: { value: 5 },
      status: "syncing",
      retryCount: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:error",
      kind: "mood",
      payload: { value: 3 },
      status: "failed",
      retryCount: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastError: "e".repeat(300),
    });

    expect(await compactOfflineOperations(OWNER_ID)).toEqual({
      scanned: 2,
      recovered: 0,
      normalizedErrors: 1,
      expiredOperations: 0,
      expiredSnapshots: 0,
    });
    const operations = await listOfflineOperations(OWNER_ID, "mood");
    expect(
      operations.find(({ id }) => id === "mood:error")?.lastError,
    ).toHaveLength(240);
  });

  it("purges encrypted operations and snapshots after the 30-day local retention limit", async () => {
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:expired",
      kind: "mood",
      payload: { value: 1 },
      status: "failed",
      retryCount: 3,
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-02T10:00:00.000Z",
    });
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:retained",
      kind: "mood",
      payload: { value: 8 },
      status: "pending",
      retryCount: 0,
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T10:00:00.000Z",
    });
    await addOfflineOperation({
      ...REQUIRED_METADATA,
      id: "mood:invalid-date",
      kind: "mood",
      payload: { value: 4 },
      status: "pending",
      retryCount: 0,
      createdAt: "invalid",
      updatedAt: "2026-07-20T10:00:00.000Z",
    });
    await saveEncryptedOfflineSnapshot(OWNER_ID, "safety-plan", {
      warningSigns: ["encrypted"],
    });
    const snapshotKey = "moodday.offline.snapshot.v2.user-alice.safety-plan";
    const snapshot = JSON.parse(
      window.localStorage.getItem(snapshotKey) ?? "{}",
    ) as Record<string, unknown>;
    window.localStorage.setItem(
      snapshotKey,
      JSON.stringify({ ...snapshot, updatedAt: "2026-07-01T10:00:00.000Z" }),
    );
    const corruptSnapshotKey =
      "moodday.offline.snapshot.v2.user-alice.consultation";
    window.localStorage.setItem(corruptSnapshotKey, "not-json");
    Object.defineProperty(window.localStorage, "length", {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(window.localStorage, "key", {
      configurable: true,
      value: (index: number) =>
        [snapshotKey, corruptSnapshotKey][index] ?? null,
    });

    await expect(
      compactOfflineOperations(OWNER_ID, {
        now: new Date("2026-08-14T10:00:00.000Z"),
      }),
    ).resolves.toEqual({
      scanned: 3,
      recovered: 0,
      normalizedErrors: 0,
      expiredOperations: 2,
      expiredSnapshots: 2,
    });
    expect(
      (await listOfflineOperations(OWNER_ID, "mood")).map(({ id }) => id),
    ).toEqual(["mood:retained"]);
    expect(
      await getEncryptedOfflineSnapshot(OWNER_ID, "safety-plan"),
    ).toBeNull();
  });

  it("purges one owner's ciphertext and key without touching another owner", async () => {
    await queueAction(OWNER_ID, checkIn("ok"));
    await queueAction(OTHER_OWNER_ID, checkIn("hard"));
    setActiveOfflineOwner(OWNER_ID);

    await purgeOfflineDataForOwner(OWNER_ID);

    expect(await getQueuedActions(OWNER_ID)).toEqual([]);
    expect(await getQueuedActions(OTHER_OWNER_ID)).toHaveLength(1);
    expect(mayHaveOfflineOperations(OWNER_ID)).toBe(false);
    expect(getActiveOfflineOwner()).toBeNull();
  });

  it("evaluates retry due dates and safely closes an already closed database", async () => {
    const base = {
      ...REQUIRED_METADATA,
      id: "mood:due",
      kind: "mood" as const,
      payload: { value: 5 },
      status: "failed" as const,
      retryCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(isOfflineOperationDue(base)).toBe(true);
    expect(
      isOfflineOperationDue({
        ...base,
        nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
      }),
    ).toBe(true);
    expect(
      isOfflineOperationDue({
        ...base,
        nextAttemptAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(false);

    await closeOfflineDatabase();
    await closeOfflineDatabase();
  });

  it("isolates and encrypts queues belonging to different accounts", async () => {
    await queueAction(OWNER_ID, {
      ...checkIn("fragile"),
      privateNote: "alice private journal content",
    });
    await queueAction(OTHER_OWNER_ID, {
      ...checkIn("ok"),
      privateNote: "bob private",
    });

    expect(await getQueuedActions(OWNER_ID)).toHaveLength(1);
    expect(await getQueuedActions(OTHER_OWNER_ID)).toHaveLength(1);
    expect(
      JSON.stringify(await getQueuedActions(OTHER_OWNER_ID)),
    ).not.toContain("alice private journal content");

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("moodday-offline", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction("operations", "readonly");
    const persisted = await new Promise<unknown[]>((resolve, reject) => {
      const request = transaction.objectStore("operations").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(JSON.stringify(persisted)).not.toContain(
      "alice private journal content",
    );
    expect(JSON.stringify(persisted)).not.toContain('"payload"');
    database.close();
  });
});

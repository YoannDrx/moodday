import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});
it.each(["error", "blocked"] as const)(
  "reports an IndexedDB open %s instead of pretending the queue is empty",
  async (event) => {
    vi.resetModules();
    const request: Record<string, unknown> = { error: null };
    vi.stubGlobal("indexedDB", {
      open: () => {
        queueMicrotask(() => (request[`on${event}`] as () => void)());
        return request;
      },
    });
    const { listOfflineOperations } = await import(
      "@/features/pwa/offline-store"
    );
    await expect(listOfflineOperations("owner", "mood")).rejects.toThrow(
      event === "error" ? "Unable to open" : "blocked",
    );
  },
);
it.each([
  { event: "abort", error: null, message: "aborted" },
  { event: "error", error: null, message: "failed" },
  { event: "error", error: { name: "QuotaExceededError" }, message: "quota" },
  {
    event: "abort",
    error: new Error("disk unavailable"),
    message: "disk unavailable",
  },
])(
  "propagates transaction $event ($message) without acknowledging a purge",
  async ({ event, error, message }) => {
    vi.resetModules();
    const transaction: Record<string, unknown> = {
      error,
      objectStore: () => ({ clear: vi.fn() }),
    };
    const database = {
      transaction: () => {
        queueMicrotask(() => (transaction[`on${event}`] as () => void)());
        return transaction;
      },
    };
    const request: Record<string, unknown> = { result: database };
    vi.stubGlobal("indexedDB", {
      open: () => {
        queueMicrotask(() => (request.onsuccess as () => void)());
        return request;
      },
    });
    const { clearOfflineOperations } = await import(
      "@/features/pwa/offline-store"
    );
    await expect(clearOfflineOperations()).rejects.toThrow(message);
  },
);
it.each([null, new Error("read failed"), { name: "QuotaExceededError" }])(
  "does not report an empty queue when an IndexedDB read fails",
  async (error) => {
    vi.resetModules();
    const read: Record<string, unknown> = { error };
    const database = {
      transaction: () => ({
        objectStore: () => ({
          index: () => ({
            getAll: () => {
              queueMicrotask(() => (read.onerror as () => void)());
              return read;
            },
          }),
        }),
      }),
    };
    const request: Record<string, unknown> = { result: database };
    vi.stubGlobal("indexedDB", {
      open: () => {
        queueMicrotask(() => (request.onsuccess as () => void)());
        return request;
      },
    });
    const { listOfflineOperations } = await import(
      "@/features/pwa/offline-store"
    );
    await expect(listOfflineOperations("owner", "mood")).rejects.toThrow();
  },
);
it("reopens persisted encryption keys after a module reload without losing the payload", async () => {
  vi.resetModules();
  const first = await import("@/features/pwa/offline-store");
  await first.saveEncryptedOfflineSnapshot("reload-owner", "safety", {
    contacts: ["Synthetic"],
  });
  await first.closeOfflineDatabase();
  vi.resetModules();
  const second = await import("@/features/pwa/offline-store");
  expect(
    await second.getEncryptedOfflineSnapshot("reload-owner", "safety"),
  ).toEqual({ contacts: ["Synthetic"] });
  await second.closeOfflineDatabase();
  vi.resetModules();
  const third = await import("@/features/pwa/offline-store");
  await third.saveEncryptedOfflineSnapshot("reload-owner", "safety", {
    contacts: ["Updated"],
  });
  expect(
    await third.getEncryptedOfflineSnapshot("reload-owner", "safety"),
  ).toEqual({ contacts: ["Updated"] });
  await third.purgeOfflineDataForOwner("reload-owner");
  await third.closeOfflineDatabase();
});
it("migrates unowned V1 rows by removing them and closes connections on version change", async () => {
  vi.resetModules();
  const deleted = indexedDB.deleteDatabase("moodday-offline");
  await new Promise<void>((resolve, reject) => {
    deleted.onsuccess = () => resolve();
    deleted.onerror = () => reject(deleted.error);
  });
  const legacy = indexedDB.open("moodday-offline", 1);
  legacy.onupgradeneeded = () => {
    const store = legacy.result.createObjectStore("operations", {
      keyPath: "id",
    });
    store.createIndex("ownerId", "ownerId");
    store.createIndex("ownerKind", ["ownerId", "kind"]);
    store.createIndex("status", "status");
    store.createIndex("createdAt", "createdAt");
    legacy.result.createObjectStore("keys", { keyPath: "ownerId" });
    store.put({ id: "unsafe", payload: "unowned" });
  };
  const old = await new Promise<IDBDatabase>((resolve) => {
    legacy.onsuccess = () => resolve(legacy.result);
  });
  old.close();
  const store = await import("@/features/pwa/offline-store");
  expect(await store.listOfflineOperations("owner", "mood")).toEqual([]);
  const upgrade = indexedDB.open("moodday-offline", 3);
  const upgraded = await new Promise<IDBDatabase>((resolve) => {
    upgrade.onsuccess = () => resolve(upgrade.result);
  });
  upgraded.close();
  await store.closeOfflineDatabase();
  const remove = indexedDB.deleteDatabase("moodday-offline");
  await new Promise<void>((resolve) => {
    remove.onsuccess = () => resolve();
  });
});
it("retries key creation after a crypto failure instead of caching a rejected key forever", async () => {
  vi.resetModules();
  const store = await import("@/features/pwa/offline-store");
  vi.spyOn(crypto.subtle, "generateKey").mockRejectedValueOnce(
    new Error("temporarily unavailable"),
  );
  await expect(
    store.saveEncryptedOfflineSnapshot("retry-key-owner", "safety", {}),
  ).rejects.toThrow("temporarily unavailable");
  await store.saveEncryptedOfflineSnapshot("retry-key-owner", "safety", {
    ready: true,
  });
  expect(
    await store.getEncryptedOfflineSnapshot("retry-key-owner", "safety"),
  ).toEqual({ ready: true });
  await store.purgeOfflineDataForOwner("retry-key-owner");
  await store.closeOfflineDatabase();
});
it("does not silently ignore a failed legacy purge and can retry safely", async () => {
  vi.resetModules();
  const store = await import("@/features/pwa/offline-store");
  vi.mocked(window.localStorage.removeItem).mockImplementationOnce(() => {
    throw new Error("storage denied");
  });
  await expect(store.listOfflineOperations("owner", "mood")).rejects.toThrow(
    "storage denied",
  );
  expect(await store.listOfflineOperations("owner", "mood")).toEqual([]);
  await store.closeOfflineDatabase();
});
it("preserves fresh snapshots, purges corrupt metadata and expires the last queued operation", async () => {
  vi.resetModules();
  const store = await import("@/features/pwa/offline-store");
  const browserStorage = window.localStorage;
  const entries = new Map<string, string>();
  const storage = {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()].at(index) ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
  };
  window.localStorage = storage as Storage;
  try {
    await store.saveEncryptedOfflineSnapshot("retention-owner", "fresh", {
      keep: true,
    });
    storage.setItem(
      "moodday.offline.snapshot.v2.retention-owner.invalid",
      "null",
    );
    await store.addOfflineOperation({
      id: "old-op",
      ownerId: "retention-owner",
      schemaVersion: 2,
      kind: "mood",
      payload: {},
      status: "pending",
      retryCount: 0,
      createdAt: "2020-01-01T00:00:00Z",
      updatedAt: "2020-01-01T00:00:00Z",
      localDateAtCreation: "2020-01-01",
      timeZoneAtCreation: "Europe/Paris",
    });
    expect(
      await store.compactOfflineOperations("retention-owner"),
    ).toMatchObject({ expiredSnapshots: 1, expiredOperations: 1 });
    expect(store.mayHaveOfflineOperations("retention-owner")).toBe(false);
    expect(
      await store.getEncryptedOfflineSnapshot("retention-owner", "fresh"),
    ).toEqual({ keep: true });
    await store.purgeOfflineDataForOwner("retention-owner");
  } finally {
    window.localStorage = browserStorage;
    await store.closeOfflineDatabase();
  }
});

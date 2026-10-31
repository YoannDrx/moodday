import { describe, expect, it, vi } from "vitest";
import { MoodDayApiError } from "../packages/api-client/src";
import type { SaveCheckInInput } from "../packages/contracts/src";
import {
  createCheckInQueue,
  createChunkedStore,
  isRetryableDeliveryError,
  toAsciiJson,
  type KeyValueStore,
} from "../apps/mobile/src/lib/offline-queue-core";

const memoryStore = () => {
  const values = new Map<string, string>();
  const store: KeyValueStore = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
  };
  return { values, store };
};

const checkIn = (
  localDate: string,
  operationId: string,
  privateNote: string | null = null,
): SaveCheckInInput => ({
  operationId,
  localDate,
  timezone: "Europe/Paris",
  state: "fragile",
  symptoms: ["cramps"],
  needs: ["hug"],
  privateNote,
});

const apiError = (code: string, recoverable: boolean) =>
  new MoodDayApiError({ code, message: code, recoverable, requestId: "test" });

describe("native offline check-in queue", () => {
  it("keeps every keychain chunk under the 2 048-byte limit, accents included", async () => {
    const { values, store } = memoryStore();
    const chunked = createChunkedStore(store, 1_800);
    const note =
      "Journée en pente, j’ai pleuré à 16 h. Ça ira mieux. 🌧️ ".repeat(40);
    const queue = createCheckInQueue(chunked, "moodday.offline-checkins.owner");

    await queue.enqueue(checkIn("2026-10-30", "operation-0001", note));

    const chunks = [...values.entries()].filter(
      ([key]) => !key.endsWith(".count"),
    );
    expect(chunks.length).toBeGreaterThan(1);
    for (const [, chunk] of chunks) {
      expect(new TextEncoder().encode(chunk).byteLength).toBeLessThanOrEqual(
        1_800,
      );
    }
    const restored = (await queue.list()).at(0);
    expect(restored?.input.privateNote).toBe(note);
  });

  it("escapes non-ASCII characters without changing the decoded value", () => {
    const value = { note: "Fragile · « un câlin » 🌧️" };
    const encoded = toAsciiJson(value);
    expect(encoded).toMatch(/^[\x20-\x7e]*$/u);
    expect(JSON.parse(encoded)).toEqual(value);
  });

  it("removes stale chunks when a shorter value replaces a longer one", async () => {
    const { values, store } = memoryStore();
    const chunked = createChunkedStore(store, 10);
    await chunked.write("key", "x".repeat(35));
    await chunked.write("key", "short");
    expect(await chunked.read("key")).toBe("short");
    expect([...values.keys()].sort()).toEqual(["key.0", "key.count"]);
  });

  it("keeps one pending point per day, the most recent one winning", async () => {
    const { store } = memoryStore();
    const queue = createCheckInQueue(createChunkedStore(store), "queue");
    await queue.enqueue(checkIn("2026-10-30", "operation-first"));
    await queue.enqueue(checkIn("2026-10-29", "operation-older-day"));
    await queue.enqueue(checkIn("2026-10-30", "operation-second"));

    const items = await queue.list();
    expect(items.map((item) => item.input.operationId)).toEqual([
      "operation-older-day",
      "operation-second",
    ]);
  });

  it("replays oldest first with the original operationId, so retries stay idempotent", async () => {
    const { store } = memoryStore();
    const queue = createCheckInQueue(createChunkedStore(store), "queue");
    await queue.enqueue(checkIn("2026-10-30", "operation-today"));
    await queue.enqueue(checkIn("2026-10-29", "operation-yesterday"));
    const send = vi.fn().mockResolvedValue({});

    expect(await queue.replay(send)).toEqual({
      sent: 2,
      dropped: 0,
      remaining: 0,
    });
    expect(send.mock.calls.map(([input]) => input.operationId)).toEqual([
      "operation-yesterday",
      "operation-today",
    ]);
    expect(await queue.count()).toBe(0);
  });

  it("stops at a network failure and keeps the rest for the next replay", async () => {
    const { store } = memoryStore();
    const queue = createCheckInQueue(createChunkedStore(store), "queue");
    await queue.enqueue(checkIn("2026-10-28", "operation-a"));
    await queue.enqueue(checkIn("2026-10-29", "operation-b"));
    await queue.enqueue(checkIn("2026-10-30", "operation-c"));
    const send = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new TypeError("Network request failed"));

    expect(await queue.replay(send)).toEqual({
      sent: 1,
      dropped: 0,
      remaining: 2,
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect((await queue.list()).map((item) => item.input.operationId)).toEqual([
      "operation-b",
      "operation-c",
    ]);
  });

  it("drops a point the server refused for good, and waits after an expired session", async () => {
    const { store } = memoryStore();
    const queue = createCheckInQueue(createChunkedStore(store), "queue");
    await queue.enqueue(checkIn("2026-10-28", "operation-invalid"));
    await queue.enqueue(checkIn("2026-10-29", "operation-auth"));
    const send = vi
      .fn()
      .mockRejectedValueOnce(apiError("validation_failed", false))
      .mockRejectedValueOnce(apiError("authentication_required", false));

    expect(await queue.replay(send)).toEqual({
      sent: 0,
      dropped: 1,
      remaining: 1,
    });
    expect((await queue.list()).at(0)?.input.operationId).toBe(
      "operation-auth",
    );
  });

  it("queues network and transient failures, never validation refusals", () => {
    expect(
      isRetryableDeliveryError(new TypeError("Network request failed")),
    ).toBe(true);
    expect(
      isRetryableDeliveryError(apiError("unexpected_response", true)),
    ).toBe(true);
    expect(isRetryableDeliveryError(apiError("rate_limited", true))).toBe(true);
    expect(isRetryableDeliveryError(apiError("validation_failed", false))).toBe(
      false,
    );
    expect(
      isRetryableDeliveryError(apiError("authentication_required", false)),
    ).toBe(false);
  });

  it("ignores a corrupted queue instead of crashing the app", async () => {
    const { store } = memoryStore();
    const chunked = createChunkedStore(store);
    await chunked.write("queue", "{not json");
    const queue = createCheckInQueue(chunked, "queue");
    expect(await queue.list()).toEqual([]);
  });
});

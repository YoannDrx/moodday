/* eslint-disable no-await-in-loop -- keychain chunks and replays are sequential on purpose */
import { MoodDayApiError } from "@moodday/api-client";
import type { SaveCheckInInput } from "@moodday/contracts";

// Pure logic of the offline check-in queue. The native adapter lives in
// offline-queue.ts; everything here is testable without React Native.

export type KeyValueStore = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

/**
 * Keychain entries are only guaranteed up to 2 048 bytes. Values are escaped
 * to ASCII (one byte per character) and split into chunks under that limit.
 */
export const toAsciiJson = (value: unknown) =>
  JSON.stringify(value).replace(
    /[^\x20-\x7e]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );

export const createChunkedStore = (store: KeyValueStore, chunkSize = 1_800) => {
  const countKey = (key: string) => `${key}.count`;
  const chunkKey = (key: string, index: number) => `${key}.${index}`;

  const readCount = async (key: string) => {
    const raw = await store.get(countKey(key));
    const count = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(count) && count > 0 ? count : 0;
  };

  const remove = async (key: string) => {
    const count = await readCount(key);
    for (let index = 0; index < count; index += 1)
      await store.remove(chunkKey(key, index));
    await store.remove(countKey(key));
  };

  return {
    read: async (key: string) => {
      const count = await readCount(key);
      if (count === 0) return null;
      let value = "";
      for (let index = 0; index < count; index += 1) {
        const chunk = await store.get(chunkKey(key, index));
        if (chunk === null) return null;
        value += chunk;
      }
      return value;
    },
    write: async (key: string, value: string) => {
      const previous = await readCount(key);
      const chunks: string[] = [];
      for (let start = 0; start < value.length; start += chunkSize)
        chunks.push(value.slice(start, start + chunkSize));
      for (const [index, chunk] of chunks.entries())
        await store.set(chunkKey(key, index), chunk);
      await store.set(countKey(key), String(chunks.length));
      for (let index = chunks.length; index < previous; index += 1)
        await store.remove(chunkKey(key, index));
    },
    remove,
  };
};

export type QueuedCheckIn = {
  input: SaveCheckInInput;
  queuedAt: string;
};

/** Network failures and transient server errors go to the queue. */
export const isRetryableDeliveryError = (error: unknown) => {
  if (!(error instanceof MoodDayApiError)) return true;
  if (error.code === "authentication_required") return false;
  return error.recoverable || error.code === "unexpected_response";
};

export type ReplayResult = { sent: number; dropped: number; remaining: number };

const parseQueue = (raw: string | null): QueuedCheckIn[] => {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is QueuedCheckIn => {
      if (typeof item !== "object" || item === null || !("input" in item))
        return false;
      const input = (item as { input: unknown }).input;
      return (
        typeof input === "object" &&
        input !== null &&
        typeof (input as Record<string, unknown>).operationId === "string" &&
        typeof (input as Record<string, unknown>).localDate === "string"
      );
    });
  } catch {
    return [];
  }
};

/**
 * One pending check-in per day: the server keeps a single point per civil
 * date, so a newer point replaces an older queued one for the same date.
 * Replays are idempotent because each entry keeps its own operationId.
 */
export const createCheckInQueue = (
  store: ReturnType<typeof createChunkedStore>,
  key: string,
) => {
  const list = async () => parseQueue(await store.read(key));
  const save = async (items: QueuedCheckIn[]) => {
    if (items.length === 0) await store.remove(key);
    else await store.write(key, toAsciiJson(items));
  };

  return {
    list,
    count: async () => (await list()).length,
    clear: async () => store.remove(key),
    enqueue: async (input: SaveCheckInInput, now = new Date()) => {
      const items = (await list()).filter(
        (item) => item.input.localDate !== input.localDate,
      );
      items.push({ input, queuedAt: now.toISOString() });
      items.sort((a, b) => a.input.localDate.localeCompare(b.input.localDate));
      await save(items);
      return items.length;
    },
    /**
     * Sends queued points oldest first. Stops at the first retryable error
     * (still offline, server busy, session expired) and drops points the
     * server definitively refused, so one bad entry never blocks the rest.
     */
    replay: async (
      send: (input: SaveCheckInInput) => Promise<unknown>,
    ): Promise<ReplayResult> => {
      const items = await list();
      let sent = 0;
      let dropped = 0;
      let index = 0;
      for (const item of items) {
        try {
          await send(item.input);
          sent += 1;
        } catch (error) {
          if (
            isRetryableDeliveryError(error) ||
            (error instanceof MoodDayApiError &&
              error.code === "authentication_required")
          )
            break;
          dropped += 1;
        }
        index += 1;
      }
      const remaining = items.slice(index);
      if (sent > 0 || dropped > 0) await save(remaining);
      return { sent, dropped, remaining: remaining.length };
    },
  };
};

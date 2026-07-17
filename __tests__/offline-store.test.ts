import "fake-indexeddb/auto";

import {
  addOfflineOperation,
  clearOfflineOperations,
  closeOfflineDatabase,
  compactOfflineOperations,
  countOfflineOperations,
  getOfflineRetryDelay,
  listOfflineOperations,
  removeOfflineOperation,
  retryOfflineOperation,
  updateOfflineOperation,
} from "@/features/pwa/offline-store";
import { getQueuedActions, queueAction } from "@/features/pwa/offline-actions";
import {
  discardQueuedMoodEntry,
  getQueuedMoodEntries,
  queueMoodEntry,
} from "@/features/pwa/offline-queue";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import { afterEach, describe, expect, it } from "vitest";

afterEach(async () => {
  window.localStorage.clear();
  await clearOfflineOperations();
});

describe("offline IndexedDB store", () => {
  it("migrates legacy localStorage queues without losing payloads", async () => {
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

    const operations = await listOfflineOperations("action");

    expect(operations).toEqual([
      expect.objectContaining({
        id: "action:legacy-1",
        status: "pending",
        retryCount: 0,
        payload: { type: "exercise_log", exerciseId: "exercise-1" },
      }),
    ]);
    expect(window.localStorage.getItem("moodday.offline.actions")).toBeNull();
  });

  it("persists status, retry metadata and explicit retry decisions", async () => {
    const createdAt = "2026-07-16T10:00:00.000Z";
    await addOfflineOperation({
      id: "mood:operation-1",
      kind: "mood",
      payload: { value: 6 },
      status: "pending",
      retryCount: 0,
      createdAt,
      updatedAt: createdAt,
    });

    await updateOfflineOperation("mood:operation-1", {
      status: "conflict",
      retryCount: 2,
      lastError: "The server version changed",
    });

    expect(await countOfflineOperations("mood")).toBe(1);
    expect(await listOfflineOperations("mood")).toEqual([
      expect.objectContaining({
        status: "conflict",
        retryCount: 2,
        lastError: "The server version changed",
      }),
    ]);

    await retryOfflineOperation("mood:operation-1");
    expect(await listOfflineOperations("mood")).toEqual([
      expect.objectContaining({
        status: "pending",
        retryCount: 0,
        lastError: undefined,
      }),
    ]);

    await removeOfflineOperation("mood:operation-1");
    expect(await countOfflineOperations()).toBe(0);
  });

  it("durably queues a quick mood and energy check-in", async () => {
    const entry = await queueMoodEntry({
      value: 7,
      energy: 4,
    });

    expect(entry.id).toMatch(/^mood:/);
    expect(await getQueuedMoodEntries()).toEqual([
      expect.objectContaining({
        id: entry.id,
        kind: "mood",
        status: "pending",
        retryCount: 0,
        payload: expect.objectContaining({
          value: 7,
          energy: 4,
          recordedAt: expect.any(String),
        }),
      }),
    ]);
  });

  it("can undo a queued mood entry before synchronization", async () => {
    const entry = await queueMoodEntry({ value: 6, energy: 3 });

    await discardQueuedMoodEntry(entry.id);

    expect(await getQueuedMoodEntries()).toEqual([]);
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
      return queueMoodEntry({ value: day + 2, energy: day + 1 }, { createdAt });
    });
    await Promise.all(queuedDays);

    await closeOfflineDatabase();
    const reopenedQueue = await getQueuedMoodEntries();

    expect(reopenedQueue).toHaveLength(7);
    expect(new Set(reopenedQueue.map((operation) => operation.id)).size).toBe(
      7,
    );
    expect(reopenedQueue.map((operation) => operation.payload.value)).toEqual([
      2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(
      reopenedQueue.every((operation) => operation.status === "pending"),
    ).toBe(true);
  });

  it("preserves the original instant and time zone when the device time zone changes", async () => {
    const createdAt = new Date("2026-03-28T23:30:00.000Z");
    const mood = await queueMoodEntry(
      { value: 6, energy: 5 },
      { createdAt, timeZone: "Europe/Paris" },
    );
    const intake = await queueAction(
      { type: "med_intake", medicationId: "medication-1", doseIndex: 0 },
      { createdAt, timeZone: "Europe/Paris" },
    );

    const [moodOperation] = await getQueuedMoodEntries();
    const [intakeOperation] = await getQueuedActions();

    expect(moodOperation).toMatchObject({
      id: mood.id,
      createdAt: createdAt.toISOString(),
      timeZoneAtCreation: "Europe/Paris",
      payload: { recordedAt: createdAt.toISOString() },
    });
    expect(intakeOperation).toMatchObject({
      id: intake.id,
      timeZoneAtCreation: "Europe/Paris",
      payload: {
        takenAt: createdAt.toISOString(),
        scheduledForDate: "2026-03-29",
      },
    });

    const intakePayload = intakeOperation.payload;
    if (intakePayload.type !== "med_intake") {
      throw new Error("Expected a medication intake operation");
    }
    expect(
      getDateKeyForTimeZone(
        new Date(intakePayload.takenAt ?? ""),
        "America/New_York",
      ),
    ).toBe("2026-03-28");
    expect(intakePayload.scheduledForDate).toBe("2026-03-29");
  });

  it("preserves PRN and exercise timestamps until synchronization", async () => {
    const createdAt = new Date("2026-10-25T01:30:00.000Z");
    await queueAction(
      { type: "med_prn_intake", medicationId: "prn-1" },
      { createdAt, timeZone: "Europe/Paris" },
    );
    await queueAction(
      { type: "exercise_log", exerciseId: "exercise-1" },
      { createdAt, timeZone: "Europe/Paris" },
    );

    const operations = await getQueuedActions();
    expect(operations.map((operation) => operation.payload)).toEqual([
      expect.objectContaining({ takenAt: createdAt.toISOString() }),
      expect.objectContaining({ completedAt: createdAt.toISOString() }),
    ]);
    expect(operations.map((operation) => operation.queuePosition)).toEqual([
      1, 2,
    ]);
  });

  it("recovers a stale syncing operation after an interrupted tab", async () => {
    await addOfflineOperation({
      id: "mood:interrupted",
      kind: "mood",
      payload: { value: 5 },
      status: "syncing",
      retryCount: 1,
      createdAt: "2026-07-16T09:00:00.000Z",
      updatedAt: "2026-07-16T09:01:00.000Z",
      lastError: "x".repeat(500),
    });

    const result = await compactOfflineOperations({
      now: new Date("2026-07-16T10:00:00.000Z"),
    });

    expect(result).toEqual({ scanned: 1, recovered: 1, normalizedErrors: 1 });
    expect(await listOfflineOperations("mood")).toEqual([
      expect.objectContaining({
        status: "pending",
        retryCount: 1,
        lastError: undefined,
        nextAttemptAt: undefined,
      }),
    ]);
  });
});

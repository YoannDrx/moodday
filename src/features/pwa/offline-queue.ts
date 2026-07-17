/* eslint-disable no-await-in-loop -- sequential offline sync required */
"use client";

import { nanoid } from "nanoid";
import { saveMoodEntry } from "@/features/mood/mood.action";
import { notifyOfflineQueueChanged } from "./offline-events";
import {
  addOfflineOperation,
  countOfflineOperations,
  getOfflineFailureStatus,
  getOfflineRetryDelay,
  getSafeOfflineTimeZone,
  isOfflineOperationDue,
  listOfflineOperations,
  removeOfflineOperation,
  updateOfflineOperation,
  type OfflineOperation,
} from "./offline-store";

export type OfflineMoodEntryPayload = {
  recordedAt?: string;
  value: number;
  note?: string;
  energy?: number;
  sleepHours?: number;
  sleepQuality?: "bad" | "average" | "good";
  sleepDisturbances?: string[];
  anxiety?: number;
  tags?: string[];
  sideEffects?: string[];
};

type OfflineMoodEntry = {
  id: string;
  payload: OfflineMoodEntryPayload;
  createdAt: string;
};

export const queueMoodEntry = async (
  payload: OfflineMoodEntryPayload,
  options?: { createdAt?: Date; timeZone?: string },
) => {
  const createdAt = options?.createdAt ?? new Date();
  const now = createdAt.toISOString();
  const timeZoneAtCreation = getSafeOfflineTimeZone(options?.timeZone);
  const entry: OfflineMoodEntry = {
    id: `mood:${nanoid(10)}`,
    payload: { ...payload, recordedAt: payload.recordedAt ?? now },
    createdAt: now,
  };
  await addOfflineOperation({
    ...entry,
    kind: "mood",
    status: "pending",
    retryCount: 0,
    updatedAt: now,
    timeZoneAtCreation,
  });
  notifyOfflineQueueChanged();
  return entry;
};

let activeSync: Promise<{
  synced: number;
  remaining: number;
  conflicts: number;
}> | null = null;

const runQueuedMoodSync = async () => {
  const queue = await listOfflineOperations<OfflineMoodEntryPayload>("mood");
  if (queue.length === 0) {
    return { synced: 0, remaining: 0, conflicts: 0 };
  }

  let synced = 0;

  for (const item of queue) {
    if (item.status === "conflict" || !isOfflineOperationDue(item)) continue;

    try {
      await updateOfflineOperation(item.id, { status: "syncing" });
      const result = await saveMoodEntry({
        ...item.payload,
        operationId: item.id,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      await removeOfflineOperation(item.id);
      synced += 1;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Offline synchronization failed";
      const retryCount = item.retryCount + 1;
      const status = getOfflineFailureStatus(message);
      await updateOfflineOperation(item.id, {
        status,
        retryCount,
        lastError: message,
        nextAttemptAt:
          status === "failed"
            ? new Date(
                Date.now() + getOfflineRetryDelay(retryCount),
              ).toISOString()
            : undefined,
      });
    }
  }

  const remaining =
    await listOfflineOperations<OfflineMoodEntryPayload>("mood");
  notifyOfflineQueueChanged();
  return {
    synced,
    remaining: remaining.length,
    conflicts: remaining.filter((item) => item.status === "conflict").length,
  };
};

export const syncQueuedMoodEntries = async () => {
  activeSync ??= runQueuedMoodSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
};

export const getQueuedMoodCount = async () => countOfflineOperations("mood");

export const getQueuedMoodEntries = async () =>
  listOfflineOperations<OfflineMoodEntryPayload>("mood");

export const discardQueuedMoodEntry = async (id: string) => {
  await removeOfflineOperation(id);
  notifyOfflineQueueChanged();
};

export type QueuedMoodOperation = OfflineOperation<OfflineMoodEntryPayload>;

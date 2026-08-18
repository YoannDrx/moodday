/* eslint-disable no-await-in-loop -- sequential offline sync required */
"use client";

import { nanoid } from "nanoid";
import { saveMoodEntry } from "@/features/mood/mood.action";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import { notifyOfflineQueueChanged } from "./offline-events";
import {
  addOfflineOperation,
  countOfflineOperations,
  getOfflineErrorCategory,
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
  ownerId: string;
  schemaVersion: 2;
  payload: OfflineMoodEntryPayload;
  createdAt: string;
  localDateAtCreation: string;
  timeZoneAtCreation: string;
};

export const queueMoodEntry = async (
  ownerId: string,
  payload: OfflineMoodEntryPayload,
  options?: {
    createdAt?: Date;
    timeZone?: string;
    expectedVersion?: string;
  },
) => {
  const createdAt = options?.createdAt ?? new Date();
  const now = createdAt.toISOString();
  const timeZoneAtCreation = getSafeOfflineTimeZone(options?.timeZone);
  const entry: OfflineMoodEntry = {
    id: `mood:${nanoid(10)}`,
    ownerId,
    schemaVersion: 2,
    payload: { ...payload, recordedAt: payload.recordedAt ?? now },
    createdAt: now,
    localDateAtCreation: getDateKeyForTimeZone(createdAt, timeZoneAtCreation),
    timeZoneAtCreation,
  };
  await addOfflineOperation({
    ...entry,
    kind: "mood",
    status: "pending",
    retryCount: 0,
    updatedAt: now,
    expectedVersion: options?.expectedVersion,
  });
  notifyOfflineQueueChanged();
  return entry;
};

const activeSyncByOwner = new Map<
  string,
  Promise<{
    synced: number;
    remaining: number;
    conflicts: number;
  }>
>();

const runQueuedMoodSync = async (ownerId: string) => {
  const queue = await listOfflineOperations<OfflineMoodEntryPayload>(
    ownerId,
    "mood",
  );
  if (queue.length === 0) {
    return { synced: 0, remaining: 0, conflicts: 0 };
  }

  let synced = 0;

  for (const item of queue) {
    if (item.status === "conflict" || !isOfflineOperationDue(item)) continue;

    try {
      await updateOfflineOperation(ownerId, item.id, { status: "syncing" });
      const result = await saveMoodEntry({
        ...item.payload,
        operationId: item.id,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      await removeOfflineOperation(ownerId, item.id);
      synced += 1;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Offline synchronization failed";
      const retryCount = item.retryCount + 1;
      const status = getOfflineFailureStatus(message);
      await updateOfflineOperation(ownerId, item.id, {
        status,
        retryCount,
        lastError: message,
        errorCategory: getOfflineErrorCategory(message),
        nextAttemptAt:
          status === "failed"
            ? new Date(
                Date.now() + getOfflineRetryDelay(retryCount),
              ).toISOString()
            : undefined,
      });
    }
  }

  const remaining = await listOfflineOperations<OfflineMoodEntryPayload>(
    ownerId,
    "mood",
  );
  notifyOfflineQueueChanged();
  return {
    synced,
    remaining: remaining.length,
    conflicts: remaining.filter((item) => item.status === "conflict").length,
  };
};

export const syncQueuedMoodEntries = async (ownerId: string) => {
  const existing = activeSyncByOwner.get(ownerId);
  if (existing) return existing;
  const current = runQueuedMoodSync(ownerId).finally(() => {
    activeSyncByOwner.delete(ownerId);
  });
  activeSyncByOwner.set(ownerId, current);
  return current;
};

export const getQueuedMoodCount = async (ownerId: string) =>
  countOfflineOperations(ownerId, "mood");

export const getQueuedMoodEntries = async (ownerId: string) =>
  listOfflineOperations<OfflineMoodEntryPayload>(ownerId, "mood");

export const discardQueuedMoodEntry = async (ownerId: string, id: string) => {
  await removeOfflineOperation(ownerId, id);
  notifyOfflineQueueChanged();
};

export type QueuedMoodOperation = OfflineOperation<OfflineMoodEntryPayload>;

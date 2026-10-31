/* eslint-disable no-await-in-loop -- sequential offline action processing required */
"use client";

import { nanoid } from "nanoid";
import { saveCheckInAction } from "@/features/couple/couple.action";
import { civilDateInTimeZone } from "@moodday/domain";
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

export type OfflineActionType = "check_in";

/** "Mon point" saved while offline. The private note stays on this device. */
export type OfflineActionPayload = {
  type: "check_in";
  localDate: string;
  timezone: string;
  state: "ok" | "fragile" | "hard" | "very_hard";
  symptoms: readonly string[];
  needs: readonly string[];
  privateNote?: string;
};

export type OfflineActionEntry = {
  id: string;
  ownerId: string;
  schemaVersion: 2;
  payload: OfflineActionPayload;
  createdAt: string;
  localDateAtCreation: string;
  timeZoneAtCreation: string;
};

export const queueAction = async (
  ownerId: string,
  payload: OfflineActionPayload,
  options?: {
    createdAt?: Date;
    timeZone?: string;
    expectedVersion?: string;
  },
) => {
  const createdAt = options?.createdAt ?? new Date();
  const now = createdAt.toISOString();
  const timeZoneAtCreation = getSafeOfflineTimeZone(options?.timeZone);
  const entry: OfflineActionEntry = {
    id: `action:${nanoid(10)}`,
    ownerId,
    schemaVersion: 2,
    payload,
    createdAt: now,
    localDateAtCreation: civilDateInTimeZone(createdAt, timeZoneAtCreation),
    timeZoneAtCreation,
  };
  await addOfflineOperation({
    ...entry,
    kind: "action",
    status: "pending",
    retryCount: 0,
    updatedAt: now,
    expectedVersion: options?.expectedVersion,
  });
  notifyOfflineQueueChanged();
  return entry;
};

export const getQueuedActionCount = async (ownerId: string) =>
  countOfflineOperations(ownerId, "action");

const activeSyncByOwner = new Map<
  string,
  Promise<{
    synced: number;
    remaining: number;
    conflicts: number;
  }>
>();

const runQueuedActionSync = async (ownerId: string) => {
  const queue = await listOfflineOperations<OfflineActionPayload>(
    ownerId,
    "action",
  );
  if (queue.length === 0) {
    return { synced: 0, remaining: 0, conflicts: 0 };
  }

  let synced = 0;

  for (const item of queue) {
    if (item.status === "conflict" || !isOfflineOperationDue(item)) continue;

    try {
      await updateOfflineOperation(ownerId, item.id, { status: "syncing" });
      const payload = item.payload;
      const result = await saveCheckInAction({
        operationId: item.id,
        localDate: payload.localDate,
        timezone: payload.timezone,
        state: payload.state,
        symptoms: [...payload.symptoms],
        needs: [...payload.needs],
        privateNote: payload.privateNote ?? null,
      });
      if (result.serverError) throw new Error(result.serverError);
      if (result.validationErrors) throw new Error("validation_failed");
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

  const remaining = await listOfflineOperations<OfflineActionPayload>(
    ownerId,
    "action",
  );
  notifyOfflineQueueChanged();
  return {
    synced,
    remaining: remaining.length,
    conflicts: remaining.filter((item) => item.status === "conflict").length,
  };
};

export const syncQueuedActions = async (ownerId: string) => {
  const existing = activeSyncByOwner.get(ownerId);
  if (existing) return existing;
  const current = runQueuedActionSync(ownerId).finally(() => {
    activeSyncByOwner.delete(ownerId);
  });
  activeSyncByOwner.set(ownerId, current);
  return current;
};

export const getQueuedActions = async (ownerId: string) =>
  listOfflineOperations<OfflineActionPayload>(ownerId, "action");

export type QueuedActionOperation = OfflineOperation<OfflineActionPayload>;

/* eslint-disable no-await-in-loop -- sequential offline action processing required */
"use client";

import { nanoid } from "nanoid";
import {
  logMedIntake,
  logPRNIntake,
  skipMedIntake,
} from "@/features/medication/medication.action";
import { logExerciseCompletion } from "@/features/exercise/exercise.action";
import { createTherapySession } from "@/features/therapy/therapy.action";
import { createV2CheckIn } from "@/features/v2/check-ins/check-in.action";
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

export type OfflineActionType =
  | "med_intake"
  | "med_skip"
  | "med_prn_intake"
  | "exercise_log"
  | "therapy_create"
  | "v2_check_in";

export type OfflineActionPayload =
  | {
      type: "med_intake";
      medicationId: string;
      doseIndex?: number;
      scheduledForDate?: string;
      takenAt?: string;
    }
  | {
      type: "med_skip";
      medicationId: string;
      doseIndex?: number;
      scheduledForDate?: string;
      takenAt?: string;
      reason?: string;
    }
  | {
      type: "med_prn_intake";
      medicationId: string;
      reason?: string;
      takenAt?: string;
    }
  | {
      type: "exercise_log";
      exerciseId: string;
      note?: string;
      completedAt?: string;
    }
  | {
      type: "therapy_create";
      date: string;
      notes: string;
      benefitRating?: number;
    }
  | {
      type: "v2_check_in";
      depth: "presence" | "quick" | "complete";
      localDate: string;
      timezone: string;
      valence?: number;
      activation?: number;
      irritability?: number;
      anxiety?: number;
      contexts: readonly string[];
      note?: string;
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

const preserveOfflineActionTime = (
  payload: OfflineActionPayload,
  createdAt: Date,
  timeZone: string,
): OfflineActionPayload => {
  const instant = createdAt.toISOString();
  switch (payload.type) {
    case "med_intake":
    case "med_skip":
      return {
        ...payload,
        takenAt: payload.takenAt ?? instant,
        scheduledForDate:
          payload.scheduledForDate ??
          getDateKeyForTimeZone(createdAt, timeZone),
      };
    case "med_prn_intake":
      return { ...payload, takenAt: payload.takenAt ?? instant };
    case "exercise_log":
      return { ...payload, completedAt: payload.completedAt ?? instant };
    case "therapy_create":
    case "v2_check_in":
      return payload;
  }
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
    payload: preserveOfflineActionTime(payload, createdAt, timeZoneAtCreation),
    createdAt: now,
    localDateAtCreation: getDateKeyForTimeZone(createdAt, timeZoneAtCreation),
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
      switch (payload.type) {
        case "med_intake": {
          const result = await logMedIntake({
            medicationId: payload.medicationId,
            operationId: item.id,
            doseIndex: payload.doseIndex,
            scheduledForDate: payload.scheduledForDate,
            takenAt: payload.takenAt,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "med_skip": {
          const result = await skipMedIntake({
            medicationId: payload.medicationId,
            operationId: item.id,
            doseIndex: payload.doseIndex,
            scheduledForDate: payload.scheduledForDate,
            takenAt: payload.takenAt,
            reason: payload.reason,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "med_prn_intake": {
          const result = await logPRNIntake({
            medicationId: payload.medicationId,
            reason: payload.reason,
            operationId: item.id,
            takenAt: payload.takenAt,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "exercise_log": {
          const result = await logExerciseCompletion({
            exerciseId: payload.exerciseId,
            note: payload.note,
            operationId: item.id,
            completedAt: payload.completedAt,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "therapy_create": {
          const result = await createTherapySession({
            operationId: item.id,
            date: payload.date,
            notes: payload.notes,
            benefitRating: payload.benefitRating,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "v2_check_in": {
          const result = await createV2CheckIn({
            operationId: item.id,
            depth: payload.depth,
            localDate: payload.localDate,
            timezone: payload.timezone,
            valence: payload.valence,
            activation: payload.activation,
            irritability: payload.irritability,
            anxiety: payload.anxiety,
            contexts: [...payload.contexts],
            note: payload.note,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        default:
          throw new Error("Unknown offline action");
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

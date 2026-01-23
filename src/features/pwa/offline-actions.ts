"use client";

import { nanoid } from "nanoid";
import { logMedIntake, logPRNIntake } from "@/features/medication/medication.action";
import { logExerciseCompletion } from "@/features/exercise/exercise.action";
import { createTherapySession } from "@/features/therapy/therapy.action";

export type OfflineActionType =
  | "med_intake"
  | "med_prn_intake"
  | "exercise_log"
  | "therapy_create";

export type OfflineActionPayload =
  | { type: "med_intake"; medicationId: string }
  | { type: "med_prn_intake"; medicationId: string; reason?: string }
  | { type: "exercise_log"; exerciseId: string; note?: string }
  | { type: "therapy_create"; date: string; notes: string; benefitRating?: number };

export type OfflineActionEntry = {
  id: string;
  payload: OfflineActionPayload;
  createdAt: string;
};

const STORAGE_KEY = "moodday.offline.actions";

const readQueue = (): OfflineActionEntry[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as OfflineActionEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: OfflineActionEntry[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const queueAction = (payload: OfflineActionPayload) => {
  const queue = readQueue();
  const entry: OfflineActionEntry = {
    id: nanoid(10),
    payload,
    createdAt: new Date().toISOString(),
  };
  writeQueue([...queue, entry]);
  return entry;
};

export const getQueuedActionCount = () => readQueue().length;

export const syncQueuedActions = async () => {
  const queue = readQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const remaining: OfflineActionEntry[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const payload = item.payload;
      switch (payload.type) {
        case "med_intake": {
          const result = await logMedIntake({ medicationId: payload.medicationId });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "med_prn_intake": {
          const result = await logPRNIntake({
            medicationId: payload.medicationId,
            reason: payload.reason,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "exercise_log": {
          const result = await logExerciseCompletion({
            exerciseId: payload.exerciseId,
            note: payload.note,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        case "therapy_create": {
          const result = await createTherapySession({
            date: payload.date,
            notes: payload.notes,
            benefitRating: payload.benefitRating,
          });
          if (result.serverError) throw new Error(result.serverError);
          break;
        }
        default:
          throw new Error("Unknown offline action");
      }
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return { synced, remaining: remaining.length };
};

"use client";

import { nanoid } from "nanoid";
import { saveMoodEntry } from "@/features/mood/mood.action";

export type OfflineMoodEntryPayload = {
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

const STORAGE_KEY = "moodday.offline.mood";

const readQueue = (): OfflineMoodEntry[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as OfflineMoodEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: OfflineMoodEntry[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const queueMoodEntry = (payload: OfflineMoodEntryPayload) => {
  const queue = readQueue();
  const entry: OfflineMoodEntry = {
    id: nanoid(10),
    payload,
    createdAt: new Date().toISOString(),
  };
  writeQueue([...queue, entry]);
  return entry;
};

export const syncQueuedMoodEntries = async () => {
  const queue = readQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const remaining: OfflineMoodEntry[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const result = await saveMoodEntry(item.payload);
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return { synced, remaining: remaining.length };
};

export const getQueuedMoodCount = () => readQueue().length;

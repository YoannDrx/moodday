import { MoodDayApiError } from "@moodday/api-client";
import type { MooddayRole, TodayDto } from "@moodday/contracts";
import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { api } from "./api";
import {
  countOfflineCheckIns,
  ownerStorageKey,
  replayOfflineCheckIns,
} from "./offline-queue";

// One shared "Aujourd'hui" read model for the four tabs and the modals. The
// server stays the only source of truth; nothing here is persisted except
// the role, which lets the app pick the right tabs while offline.

export type TodayState = {
  ownerId?: string;
  status: "idle" | "loading" | "ready" | "error";
  today?: TodayDto;
  error?: "offline" | "failed";
  rememberedRole?: MooddayRole;
  pendingCheckIns: number;
  lastReplay?: { sent: number; dropped: number };
};

const initial: TodayState = { status: "idle", pendingCheckIns: 0 };
let state: TodayState = initial;
const listeners = new Set<() => void>();

const setState = (next: Partial<TodayState>) => {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getTodayState = () => state;

export const useTodayState = () =>
  useSyncExternalStore(subscribe, getTodayState, getTodayState);

const roleKey = async (ownerId: string) =>
  ownerStorageKey("moodday.role", ownerId);

const rememberRole = async (ownerId: string, role: MooddayRole | null) => {
  const key = await roleKey(ownerId);
  if (role) await SecureStore.setItemAsync(key, role);
  else await SecureStore.deleteItemAsync(key);
};

const readRememberedRole = async (ownerId: string) => {
  const value = await SecureStore.getItemAsync(await roleKey(ownerId));
  return value === "cycle_owner" || value === "supporter" ? value : undefined;
};

let inflight: Promise<void> | undefined;

/** Loads today's projection; concurrent calls share one request. */
export const refreshToday = async (ownerId: string) => {
  if (state.ownerId !== ownerId) {
    state = { ...initial, ownerId };
    inflight = undefined;
  }
  if (inflight) return inflight;
  setState({ status: state.today ? "ready" : "loading" });
  const run = async () => {
    try {
      const today = await api.getToday();
      if (state.ownerId !== ownerId) return;
      setState({ status: "ready", today, error: undefined });
      void rememberRole(ownerId, today.role).catch(() => undefined);
    } catch (error) {
      if (state.ownerId !== ownerId) return;
      const offline = !(error instanceof MoodDayApiError);
      setState({
        status: "error",
        error: offline ? "offline" : "failed",
        rememberedRole:
          (await readRememberedRole(ownerId).catch(() => undefined)) ??
          state.rememberedRole,
      });
    }
    await refreshPendingCount(ownerId);
  };
  inflight = run().finally(() => {
    inflight = undefined;
  });
  return inflight;
};

export const refreshPendingCount = async (ownerId: string) => {
  try {
    const pendingCheckIns = await countOfflineCheckIns(ownerId);
    if (state.ownerId === ownerId) setState({ pendingCheckIns });
  } catch {
    // The count is informative only.
  }
};

/** Replays offline points, then refreshes the projection if any were sent. */
export const syncOfflineAndRefresh = async (ownerId: string) => {
  try {
    const result = await replayOfflineCheckIns(ownerId);
    if (state.ownerId === ownerId)
      setState({
        pendingCheckIns: result.remaining,
        lastReplay:
          result.sent > 0 || result.dropped > 0
            ? { sent: result.sent, dropped: result.dropped }
            : state.lastReplay,
      });
  } catch {
    // Still offline: the queue stays on the device.
  }
  await refreshToday(ownerId);
};

export const dismissReplayNotice = () => setState({ lastReplay: undefined });

export const resetToday = () => {
  inflight = undefined;
  state = initial;
  for (const listener of listeners) listener();
};

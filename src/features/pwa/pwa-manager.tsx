"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/lib/auth-client";
import { getUserPreferences } from "@/features/preferences/preferences.action";
import { syncQueuedMoodEntries } from "./offline-queue";
import { syncQueuedActions } from "./offline-actions";
import {
  compactOfflineOperations,
  setActiveOfflineOwner,
} from "./offline-store";
import { unsubscribeCurrentPush } from "./push-client";
import { getPushContentMode, type PushContentMode } from "./push-content-mode";

// Matches the first offline retry backoff (getOfflineRetryDelay(1)).
const OFFLINE_RETRY_CHECK_MS = 30_000;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getPushDeviceId = () => {
  const storageKey = "moodday.push.device-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(storageKey, created);
  return created;
};

const subscribeToPush = async (
  vapidKey: string,
  locale: "fr" | "en",
  contentMode: "generic" | "detailed" = "generic",
) => {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...subscription.toJSON(),
      deviceId: getPushDeviceId(),
      locale,
      contentMode,
      trustedDevice: contentMode === "detailed",
    }),
  });
};

export function PwaManager({
  pushNotificationsEnabled,
  vapidPublicKey,
}: {
  pushNotificationsEnabled: boolean;
  vapidPublicKey?: string;
}) {
  const { data: session } = useSession();
  const [contentMode, setContentMode] = useState<PushContentMode>("generic");

  useEffect(() => {
    if (session?.user.id) setActiveOfflineOwner(session.user.id);
  }, [session?.user.id]);

  useEffect(() => {
    const ownerId = session?.user.id;
    if (!ownerId) {
      setContentMode("generic");
      return;
    }
    setContentMode(getPushContentMode(ownerId));
    const handleMode = (event: Event) => {
      const detail = (
        event as CustomEvent<{ ownerId: string; mode: PushContentMode }>
      ).detail;
      if (detail.ownerId === ownerId) setContentMode(detail.mode);
    };
    window.addEventListener("moodday:push-content-mode", handleMode);
    return () =>
      window.removeEventListener("moodday:push-content-mode", handleMode);
  }, [session?.user.id]);

  const { data: preferences } = useQuery({
    queryKey: ["user-preferences"],
    enabled: !!session?.user && pushNotificationsEnabled,
    queryFn: async () => {
      const result = await getUserPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => registration.update())
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!pushNotificationsEnabled || !preferences) return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    if (!vapidPublicKey) return;

    if (!preferences.notificationsEnabled) {
      void unsubscribeCurrentPush().catch(() => undefined);
      return;
    }

    if (Notification.permission === "granted") {
      void subscribeToPush(
        vapidPublicKey,
        preferences.locale === "en" ? "en" : "fr",
        contentMode,
      ).catch(() => undefined);
    }
  }, [contentMode, preferences, pushNotificationsEnabled, vapidPublicKey]);

  useEffect(() => {
    if (!pushNotificationsEnabled || !preferences?.notificationsEnabled) return;
    if (!("serviceWorker" in navigator)) return;

    if (!vapidPublicKey) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_SUBSCRIPTION_CHANGED") return;
      void subscribeToPush(
        vapidPublicKey,
        preferences.locale === "en" ? "en" : "fr",
        contentMode,
      ).catch(() => undefined);
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [
    preferences?.locale,
    preferences?.notificationsEnabled,
    contentMode,
    pushNotificationsEnabled,
    vapidPublicKey,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ownerId = session?.user.id;
    if (!ownerId) return;

    let retryTimer: number | undefined;
    let disposed = false;

    const handleOnline = async () => {
      window.clearTimeout(retryTimer);
      if (!navigator.onLine) return;
      await compactOfflineOperations(ownerId);
      const results = await Promise.all([
        syncQueuedMoodEntries(ownerId),
        syncQueuedActions(ownerId),
      ]);
      // A failed operation waits for its backoff; nothing else wakes the
      // queue while the page stays open, so check again once it is due.
      const retriable = results.some(
        (result) => result.remaining > result.conflicts,
      );
      if (retriable && !disposed) {
        retryTimer = window.setTimeout(() => {
          void handleOnline().catch(() => undefined);
        }, OFFLINE_RETRY_CHECK_MS);
      }
    };

    window.addEventListener("online", handleOnline);
    void handleOnline().catch(() => undefined);

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      window.removeEventListener("online", handleOnline);
    };
  }, [session?.user.id]);

  return null;
}

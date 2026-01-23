"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { getUserPreferences } from "@/features/preferences/preferences.action";
import { getTodayIntakes } from "@/features/medication/medication.action";
import { syncQueuedMoodEntries } from "./offline-queue";
import { syncQueuedActions } from "./offline-actions";

const DAILY_CHECKIN_KEY = "moodday.notification.checkin";
const MEDS_REMINDER_KEY = "moodday.notification.meds";

const getTodayKey = () => new Date().toISOString().split("T")[0] ?? "";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const showNotification = async (
  title: string,
  options?: NotificationOptions,
) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.showNotification(title, options);
    return;
  }

  // Fallback if service worker not available - intentional side effect
  void new Notification(title, options);
};

const subscribeToPush = async (vapidKey: string) => {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
};

const unsubscribeFromPush = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
};

export function PwaManager() {
  const { data: session } = useSession();

  const { data: preferences } = useQuery({
    queryKey: ["user-preferences"],
    enabled: !!session?.user,
    queryFn: async () => {
      const result = await getUserPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!preferences) return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    const vapidKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    if (!preferences.notificationsEnabled) {
      void unsubscribeFromPush().catch(() => undefined);
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          void subscribeToPush(vapidKey).catch(() => undefined);
        }
      });
      return;
    }

    if (Notification.permission === "granted") {
      void subscribeToPush(vapidKey).catch(() => undefined);
    }
  }, [preferences]);

  useEffect(() => {
    if (!preferences?.notificationsEnabled) return;
    if (!("serviceWorker" in navigator)) return;

    const vapidKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_SUBSCRIPTION_CHANGED") return;
      void subscribeToPush(vapidKey).catch(() => undefined);
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [preferences?.notificationsEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      if (navigator.onLine) {
        void syncQueuedMoodEntries();
        void syncQueuedActions();
      }
    };

    window.addEventListener("online", handleOnline);
    handleOnline();

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!preferences) return;
    if (!preferences.notificationsEnabled) return;
    if (!("Notification" in window)) return;

    const interval = window.setInterval(async () => {
      if (!navigator.onLine) return;
      const now = new Date();
      const time = now.toTimeString().slice(0, 5);
      const todayKey = getTodayKey();

      if (
        preferences.dailyCheckInReminder &&
        time === preferences.dailyCheckInTime
      ) {
        const lastCheck = window.localStorage.getItem(DAILY_CHECKIN_KEY) ?? "";
        if (lastCheck !== todayKey) {
          await showNotification("Moodday - Check-in", {
            body: "Pensez a enregistrer votre humeur du jour.",
            tag: "daily-checkin",
          });
          window.localStorage.setItem(DAILY_CHECKIN_KEY, todayKey);
        }
      }

      if (
        preferences.medicationReminders &&
        time === preferences.medicationReminderTime
      ) {
        const lastReminder = window.localStorage.getItem(MEDS_REMINDER_KEY);
        if (lastReminder !== todayKey) {
          try {
            const result = await getTodayIntakes({});
            if (!result.serverError && result.data) {
              const pending = result.data.filter((med) => {
                return med.intakes.every((intake) => intake.skipped);
              });
              if (pending.length > 0) {
                await showNotification("Moodday - Medicaments", {
                  body: "Il reste des prises a confirmer aujourd'hui.",
                  tag: "medication-reminder",
                });
                window.localStorage.setItem(MEDS_REMINDER_KEY, todayKey);
              }
            }
          } catch {
            // Ignore notification errors
          }
        }
      }
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [preferences]);

  return null;
}

"use client";

export const OFFLINE_QUEUE_CHANGED_EVENT = "moodday:offline-queue-changed";

export const notifyOfflineQueueChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OFFLINE_QUEUE_CHANGED_EVENT));
};

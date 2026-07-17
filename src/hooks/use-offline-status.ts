"use client";

import { useEffect, useState } from "react";
import { getQueuedActionCount } from "@/features/pwa/offline-actions";
import { OFFLINE_QUEUE_CHANGED_EVENT } from "@/features/pwa/offline-events";
import { getQueuedMoodCount } from "@/features/pwa/offline-queue";

const getSnapshot = async () => {
  if (typeof navigator === "undefined") {
    return { isOnline: true, queuedCount: 0 };
  }

  return {
    isOnline: navigator.onLine,
    queuedCount: (await getQueuedActionCount()) + (await getQueuedMoodCount()),
  };
};

export const useOfflineStatus = () => {
  const [status, setStatus] = useState({ isOnline: true, queuedCount: 0 });

  useEffect(() => {
    let active = true;
    const updateStatus = async () => {
      try {
        const nextStatus = await getSnapshot();
        if (active) setStatus(nextStatus);
      } catch {
        if (active) {
          setStatus({ isOnline: navigator.onLine, queuedCount: 0 });
        }
      }
    };

    void updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    window.addEventListener("storage", updateStatus);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, updateStatus);
    document.addEventListener("visibilitychange", updateStatus);

    return () => {
      active = false;
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      window.removeEventListener("storage", updateStatus);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, updateStatus);
      document.removeEventListener("visibilitychange", updateStatus);
    };
  }, []);

  return status;
};

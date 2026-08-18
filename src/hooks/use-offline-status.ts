"use client";

import { useEffect, useState } from "react";
import { getQueuedActionCount } from "@/features/pwa/offline-actions";
import { OFFLINE_QUEUE_CHANGED_EVENT } from "@/features/pwa/offline-events";
import { getQueuedMoodCount } from "@/features/pwa/offline-queue";
import { useSession } from "@/lib/auth-client";

const getSnapshot = async (ownerId?: string) => {
  if (typeof navigator === "undefined") {
    return { isOnline: true, queuedCount: 0 };
  }

  return {
    isOnline: navigator.onLine,
    queuedCount: ownerId
      ? (await getQueuedActionCount(ownerId)) +
        (await getQueuedMoodCount(ownerId))
      : 0,
  };
};

export const useOfflineStatus = (initialOwnerId?: string) => {
  const { data: session } = useSession();
  const ownerId = session?.user.id ?? initialOwnerId;
  const [status, setStatus] = useState({ isOnline: true, queuedCount: 0 });

  useEffect(() => {
    let active = true;
    const updateStatus = async () => {
      try {
        const nextStatus = await getSnapshot(ownerId);
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
  }, [ownerId]);

  return { ...status, ownerId };
};

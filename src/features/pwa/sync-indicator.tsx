"use client";

import { useEffect, useState } from "react";
import { CloudOff, CloudUpload } from "lucide-react";
import Link from "next/link";

import { getQueuedMoodCount } from "./offline-queue";
import { getQueuedActionCount } from "./offline-actions";
import { OFFLINE_QUEUE_CHANGED_EVENT } from "./offline-events";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;
    const update = async () => {
      setIsOnline(navigator.onLine);
      try {
        const nextCount =
          (await getQueuedMoodCount()) + (await getQueuedActionCount());
        if (active) setPendingCount(nextCount);
      } catch {
        if (active) setPendingCount(0);
      }
    };

    void update();

    const interval = window.setInterval(() => void update(), 3000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, update);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, update);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Link
      href="/settings/offline"
      aria-label={
        isOnline
          ? `${pendingCount} opérations en attente de synchronisation`
          : "Hors ligne — gérer les opérations en attente"
      }
      className={cn(
        "focus-visible:ring-ring/50 flex min-h-9 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring",
        isOnline
          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
          : "bg-red-50 text-red-600",
      )}
    >
      {isOnline ? (
        <CloudUpload className="size-3" />
      ) : (
        <CloudOff className="size-3" />
      )}
      {isOnline ? `${pendingCount} en attente de sync` : "Hors ligne"}
    </Link>
  );
}

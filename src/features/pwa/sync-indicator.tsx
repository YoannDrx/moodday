"use client";

import { useEffect, useState } from "react";
import { CloudOff, CloudUpload } from "lucide-react";

import { getQueuedMoodCount } from "./offline-queue";
import { getQueuedActionCount } from "./offline-actions";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setIsOnline(navigator.onLine);
      setPendingCount(getQueuedMoodCount() + getQueuedActionCount());
    };

    update();

    const interval = window.setInterval(update, 3000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        isOnline
          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
          : "bg-red-50 text-red-600",
      )}
    >
      {isOnline ? <CloudUpload className="size-3" /> : <CloudOff className="size-3" />}
      {isOnline
        ? `${pendingCount} en attente de sync`
        : "Hors ligne"}
    </div>
  );
}

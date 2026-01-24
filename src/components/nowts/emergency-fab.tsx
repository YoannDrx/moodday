"use client";

import { LifeBuoy, Phone, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type EmergencyFabProps = {
  className?: string;
};

/**
 * EmergencyFab - Floating action button for crisis support
 *
 * Always visible on mobile for quick access to emergency resources.
 * Expands to show quick actions (call 3114, go to crisis page).
 *
 * @example
 * ```tsx
 * <EmergencyFab />
 * ```
 */
export function EmergencyFab({ className }: EmergencyFabProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "fixed right-4 bottom-24 z-40 flex flex-col items-end gap-3 md:bottom-8",
        className,
      )}
    >
      {/* Expanded actions */}
      {isExpanded && (
        <>
          {/* Call 3114 */}
          <a
            href="tel:3114"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-bold text-red-600 shadow-lg transition-all hover:bg-red-50 active:scale-95"
          >
            <Phone className="size-5" />
            <span>Appeler le 3114</span>
          </a>

          {/* Crisis page link */}
          <Link
            href="/crisis"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-medium text-gray-700 shadow-lg transition-all hover:bg-gray-50 active:scale-95"
          >
            <LifeBuoy className="size-5 text-red-500" />
            <span>Ressources d&apos;aide</span>
          </Link>
        </>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group flex size-14 items-center justify-center rounded-full shadow-2xl transition-all active:scale-90",
          isExpanded
            ? "bg-gray-800 hover:bg-gray-700"
            : "bg-red-500 hover:scale-110 hover:bg-red-600",
        )}
        aria-label={isExpanded ? "Fermer" : "Besoin d'aide ?"}
      >
        {isExpanded ? (
          <X className="size-7 text-white" />
        ) : (
          <LifeBuoy className="size-7 text-white" />
        )}
      </button>

      {/* Tooltip on hover (only when not expanded) */}
      {!isExpanded && (
        <span className="pointer-events-none absolute top-1/2 right-full mr-4 -translate-y-1/2 rounded-xl bg-white px-4 py-2 text-sm font-bold whitespace-nowrap text-red-500 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          Besoin d&apos;aide ?
        </span>
      )}
    </div>
  );
}

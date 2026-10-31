"use client";

import { Button } from "@/components/ui/button";
import type { GestureDto } from "@moodday/contracts";
import { Heart } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { thankGestureAction } from "../couple.action";

const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function GestureList({
  gestures,
  partnerName,
  canThank,
  emptyText,
}: {
  gestures: GestureDto[];
  partnerName: string | null;
  canThank: boolean;
  emptyText: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (gestures.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {gestures.map((gesture) => (
        <li
          key={gesture.id}
          className="bg-card flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--ink)] px-4 py-3"
        >
          <div>
            <p className="font-bold">
              {gesture.kind === "custom"
                ? `« ${gesture.label} »`
                : gesture.label}
            </p>
            <p className="text-muted-foreground text-xs">
              {gesture.fromMe ? "Toi" : (partnerName ?? "Ton duo")} ·{" "}
              {timeLabel(gesture.createdAt)}
              {gesture.status === "thanked" && " · merci reçu"}
            </p>
          </div>
          {canThank && !gesture.fromMe && gesture.status !== "thanked" && (
            <Button
              size="sm"
              variant="mint"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await thankGestureAction({
                    gestureId: gesture.id,
                  });
                  if (result.serverError) toast.error(result.serverError);
                  else toast.success("Merci envoyé.");
                })
              }
            >
              <Heart />
              Merci
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

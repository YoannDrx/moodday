"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendGestureAction } from "../couple.action";

export function GestureButtons({
  checkInId,
  suggestions,
  ownerName,
}: {
  checkInId: string | null;
  suggestions: { key: string; label: string }[];
  ownerName: string;
}) {
  const router = useRouter();
  const [sent, setSent] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const send = (kind: string, text?: string) =>
    startTransition(async () => {
      const result = await sendGestureAction({
        operationId: nanoid(16),
        checkInId,
        kind,
        message: text ?? null,
      });
      if (result.serverError || result.validationErrors) {
        toast.error(result.serverError ?? "Ce geste n'est pas parti.");
        return;
      }
      setSent(kind);
      setMessage("");
      toast.success(`Envoyé. ${ownerName} va le voir.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.key}
            type="button"
            disabled={isPending}
            onClick={() => send(suggestion.key)}
            className={cn(
              "sticker-hover shadow-sticker flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--ink)] px-4 py-3 text-left font-bold disabled:opacity-60",
              index === 0 ? "bg-honey text-[#2b1b30]" : "bg-card",
            )}
          >
            {suggestion.label}
            <span aria-hidden>{sent === suggestion.key ? "✓" : "→"}</span>
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (message.trim()) send("custom", message.trim());
        }}
      >
        <label htmlFor="gesture-message" className="sr-only">
          Un petit mot
        </label>
        <Input
          id="gesture-message"
          maxLength={140}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ou un petit mot à toi…"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isPending || !message.trim()}
        >
          <Send />
          <span className="sr-only">Envoyer</span>
        </Button>
      </form>
    </div>
  );
}

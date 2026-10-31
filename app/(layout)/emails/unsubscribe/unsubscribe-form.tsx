"use client";

import { Button } from "@/components/ui/button";
import { unsubscribeLifecycleAction } from "@/features/couple/lifecycle.action";
import { useState, useTransition } from "react";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "done" | "invalid">("idle");
  const [isPending, startTransition] = useTransition();

  if (state === "done") {
    return (
      <p role="status" className="text-lg font-semibold">
        C'est fait. Plus de conseils par e-mail. Les e-mails de sécurité de ton
        compte continuent d'arriver.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* A button, not a GET link: mail scanners must not unsubscribe people. */}
      <Button
        variant="honey"
        size="lg"
        className="w-fit"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await unsubscribeLifecycleAction({ token });
            setState(result.data?.done ? "done" : "invalid");
          })
        }
      >
        Ne plus recevoir ces conseils
      </Button>
      {state === "invalid" && (
        <p role="alert" className="text-destructive font-semibold">
          Ce lien n'est pas valide. Tu peux aussi couper ces e-mails depuis tes
          réglages de notifications.
        </p>
      )}
    </div>
  );
}

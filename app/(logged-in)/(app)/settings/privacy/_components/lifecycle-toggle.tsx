"use client";

import { Switch } from "@/components/ui/switch";
import { setLifecycleEmailsAction } from "@/features/couple/lifecycle.action";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function LifecycleEmailsToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();
  return (
    <label className="sticker flex items-center justify-between gap-4 p-5 font-semibold">
      <span>
        Conseils de démarrage par e-mail
        <span className="text-muted-foreground block text-sm font-normal">
          Quelques e-mails les premières semaines, jamais aucune donnée de
          santé. Les e-mails de sécurité arrivent toujours.
        </span>
      </span>
      <Switch
        checked={enabled}
        disabled={isPending}
        onCheckedChange={(next) =>
          startTransition(async () => {
            const result = await setLifecycleEmailsAction({ enabled: next });
            if (result.serverError) {
              toast.error(result.serverError);
              return;
            }
            setEnabled(next);
            toast.success(
              next ? "Conseils réactivés." : "Plus de conseils par e-mail.",
            );
          })
        }
      />
    </label>
  );
}

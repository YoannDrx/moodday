"use client";

import { Button } from "@/components/ui/button";
import { BILLING_URL } from "@/lib/LINKS";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upgradeUserAction } from "./plans.action";

export function DuoOffer({
  billingEnabled,
  active,
}: {
  billingEnabled: boolean;
  active: boolean;
}) {
  const [annual, setAnnual] = useState(true);
  const [isPending, startTransition] = useTransition();

  const subscribe = () =>
    startTransition(async () => {
      const result = await upgradeUserAction({
        plan: "plus",
        annual,
        successUrl: `${BILLING_URL}/success`,
        cancelUrl: `${BILLING_URL}/cancel`,
      });
      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }
      toast.error(result.serverError ?? "Le paiement n'a pas pu démarrer.");
    });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <article className="sticker flex flex-col gap-3 p-6">
        <h2 className="text-2xl font-extrabold">Gratuit, pour toujours</h2>
        <ul className="flex flex-col gap-2">
          <li>✔ Point du jour, cycle et prédictions</li>
          <li>✔ Lien de couple, notifications et gestes</li>
          <li>✔ Programme Allié 7 jours</li>
          <li>✔ Ressources de crise, export et suppression</li>
        </ul>
      </article>
      <article className="sticker bg-honey-soft flex flex-col gap-4 p-6">
        <h2 className="text-2xl font-extrabold">Duo</h2>
        <div className="flex gap-2" role="radiogroup" aria-label="Formule">
          {[
            { value: true, label: "34,99 € / an" },
            { value: false, label: "4,99 € / mois" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={annual === option.value}
              onClick={() => setAnnual(option.value)}
              className={cn(
                "rounded-full border-2 border-[var(--ink)] px-4 py-2 text-sm font-bold",
                annual === option.value
                  ? "bg-[var(--ink)] text-[var(--cream)]"
                  : "bg-card",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold">
          Un seul abonnement couvre vos deux comptes. Essai de 7 jours.
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li>✔ Repères sur tes derniers cycles</li>
          <li>✔ Bilan à deux après les règles</li>
          <li>✔ Programme Allié avancé</li>
        </ul>
        {active ? (
          <p className="font-bold">Duo est actif pour vous deux. Merci !</p>
        ) : billingEnabled ? (
          <Button
            variant="honey"
            size="lg"
            disabled={isPending}
            onClick={subscribe}
          >
            Essayer Duo 7 jours
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">
            Duo ouvre après la bêta. D'ici là, tout est gratuit.
          </p>
        )}
      </article>
    </div>
  );
}

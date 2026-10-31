"use client";

import { Bouyotte } from "@/components/brand/bouyotte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { joinWaitlistAction } from "./waitlist.action";

const doors = [
  { value: "cycle", label: "C'est mon cycle" },
  { value: "partner", label: "Je soutiens ma ou mon partenaire" },
] as const;

export function WaitlistSection() {
  const params = useSearchParams();
  const initialDoor = params.get("porte") === "partner" ? "partner" : "cycle";
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [door, setDoor] = useState<"cycle" | "partner">(initialDoor);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "joined" | "failed">("idle");
  const [isPending, startTransition] = useTransition();

  const join = () =>
    startTransition(async () => {
      try {
        await resolveActionResult(
          joinWaitlistAction({ email, locale: "fr", door, consent: true }),
        );
        setStatus("joined");
      } catch {
        setStatus("failed");
      }
    });

  return (
    <section
      id="liste-attente"
      className="knit scroll-mt-24 border-t-2 border-[var(--ink)] px-4 py-20 sm:px-6"
      aria-labelledby={`${inputId}-title`}
    >
      <div className="sticker mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
        <Bouyotte
          mood={status === "joined" ? "happy" : "wink"}
          steam
          className="size-20"
        />
        <p className="text-sm font-bold tracking-wide uppercase">Bêta privée</p>
        <h2
          id={`${inputId}-title`}
          className="text-3xl font-extrabold sm:text-4xl"
        >
          On fait chauffer les places.
        </h2>
        {status === "joined" ? (
          <p role="status" className="text-lg font-semibold">
            C'est noté. Un seul e-mail quand ton accès est prêt, promis.
          </p>
        ) : (
          <form
            className="flex w-full flex-col gap-4 text-left"
            onSubmit={(event) => {
              event.preventDefault();
              if (consent) join();
            }}
          >
            <fieldset className="flex flex-col gap-2 sm:flex-row">
              <legend className="sr-only">Ton côté</legend>
              {doors.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border-2 border-[var(--ink)] px-3 py-2 text-sm font-bold",
                    door === option.value ? "bg-honey" : "bg-card",
                  )}
                >
                  <input
                    type="radio"
                    name="door"
                    value={option.value}
                    checked={door === option.value}
                    onChange={() => setDoor(option.value)}
                    className="accent-[var(--ink)]"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <label htmlFor={inputId} className="text-sm font-bold">
              Adresse e-mail
            </label>
            <Input
              id={inputId}
              type="email"
              required
              autoComplete="email"
              placeholder="toi@exemple.fr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 size-4 accent-[var(--ink)]"
              />
              <span>
                J'accepte que Moodday utilise mon adresse uniquement pour me
                prévenir de l'ouverture. Suppression sur simple demande.{" "}
                <Link href="/legal/privacy" className="underline">
                  Confidentialité
                </Link>
              </span>
            </label>
            <Button
              type="submit"
              variant="honey"
              size="lg"
              disabled={isPending || !consent}
            >
              {isPending ? "Envoi…" : "Rejoindre la liste d'attente"}
            </Button>
            {status === "failed" && (
              <p
                role="alert"
                className="text-destructive text-sm font-semibold"
              >
                L'inscription n'a pas abouti. Réessaie dans quelques minutes.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

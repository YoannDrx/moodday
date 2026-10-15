"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { joinWaitlistAction } from "./waitlist.action";

const copy = {
  fr: {
    eyebrow: "Bêta privée",
    title: "Moodday ouvre progressivement.",
    description:
      "Les inscriptions sont fermées pendant la bêta privée. Laisse ton e-mail : on te prévient dès qu’une place s’ouvre.",
    label: "Adresse e-mail",
    placeholder: "toi@exemple.fr",
    submit: "Rejoindre la liste d’attente",
    success:
      "C’est noté. Tu recevras un seul e-mail quand ton accès sera prêt.",
    error: "L’inscription n’a pas abouti. Réessaie dans quelques minutes.",
    notice:
      "Ton adresse sert uniquement à te prévenir de l’ouverture. Tu peux demander sa suppression à tout moment.",
    privacy: "Confidentialité",
  },
  en: {
    eyebrow: "Private beta",
    title: "Moodday is opening gradually.",
    description:
      "Registration is closed during the private beta. Leave your email and we will let you know as soon as a spot opens.",
    label: "Email address",
    placeholder: "you@example.com",
    submit: "Join the waitlist",
    success:
      "You are on the list. You will get a single email when your access is ready.",
    error: "Something went wrong. Please try again in a few minutes.",
    notice:
      "Your address is only used to tell you when Moodday opens. You can ask for it to be deleted at any time.",
    privacy: "Privacy",
  },
} as const;

export function WaitlistSection() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "fr";
  const t = copy[lang];
  const inputId = useId();
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<"idle" | "joined" | "failed">("idle");
  const [isPending, startTransition] = useTransition();

  const join = () =>
    startTransition(async () => {
      try {
        await resolveActionResult(joinWaitlistAction({ email, locale: lang }));
        setStatus("joined");
      } catch {
        setStatus("failed");
      }
    });

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-24"
      aria-labelledby={`${inputId}-title`}
    >
      <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-[#183432]/10 bg-white/70 px-6 py-12 text-center sm:px-12 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-bold tracking-[0.18em] text-[#1E7775] uppercase">
          {t.eyebrow}
        </p>
        <h2
          id={`${inputId}-title`}
          className="mt-4 font-[family-name:var(--font-caption)] text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
        >
          {t.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-[#52635F] dark:text-white/75">
          {t.description}
        </p>

        {status === "joined" ? (
          <p
            role="status"
            className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 font-semibold text-[#1E7775]"
          >
            <Check className="size-5 shrink-0" /> {t.success}
          </p>
        ) : (
          <form
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              join();
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              {t.label}
            </label>
            <Input
              id={inputId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.placeholder}
              className="h-12 rounded-full bg-white px-5 dark:bg-white/10"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="h-12 rounded-full bg-[#1E7775] px-6 text-white hover:bg-[#175f5d]"
            >
              {t.submit}
            </Button>
          </form>
        )}
        {status === "failed" ? (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {t.error}
          </p>
        ) : null}
        <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-[#52635F] dark:text-white/70">
          {t.notice}{" "}
          <Link href="/legal/privacy" className="underline">
            {t.privacy}
          </Link>
        </p>
      </div>
    </section>
  );
}

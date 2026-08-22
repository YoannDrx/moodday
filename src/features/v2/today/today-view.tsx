"use client";

import { BrandIllustration } from "@/components/brand/brand-illustration";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createV2CheckIn } from "@/features/v2/check-ins/check-in.action";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleHelp,
  Cloud,
  HeartHandshake,
  Leaf,
  MoonStar,
  Sparkles,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type CoreDimension = "valence" | "activation" | "irritability";
type CheckInMode = "idle" | "quick" | "complete" | "done";
type Scores = Partial<Record<CoreDimension | "anxiety", number>>;

const scaleValues = [0, 2, 4, 6, 8, 10] as const;

const copy = {
  fr: {
    hello: "Bonjour",
    promise: "Une seule chose suffit aujourd’hui.",
    eyebrow: "Ton point du jour",
    question: "Comment est la journée ?",
    duration: "10 à 20 secondes, ou simplement signaler ta présence.",
    quick: "Faire un point rapide",
    presence: "Je suis là",
    presenceSaved: "C’est noté.",
    saved: "Ton point est enregistré.",
    stopHere: "Tu as gardé le fil. Tu peux t’arrêter ici.",
    noPreset: "Aucune valeur n’est choisie à ta place.",
    moral: "Moral",
    moralHint: "Du très lourd au très léger",
    energy: "Énergie",
    energyHint: "Du ralenti à beaucoup d’élan",
    irritability: "Irritabilité",
    irritabilityHint: "Du calme au très sensible",
    anxiety: "Anxiété, si utile",
    anxietyHint: "De peu présente à très présente",
    addContext: "Ajouter du contexte",
    note: "Une note, si elle t’aide",
    notePlaceholder: "Ce que tu aimerais retrouver plus tard…",
    save: "Enregistrer mon point",
    saving: "Enregistrement…",
    back: "Retour",
    optional: "facultatif",
    scaleLow: "bas",
    scaleHigh: "haut",
    next: "Prochaine étape",
    careTitle: "Préparer le prochain rendez-vous",
    careEmpty:
      "Ajoute un rendez-vous pour rassembler tes questions au même endroit.",
    prepare: "Ouvrir Soin",
    available: "Repères disponibles",
    source: "Données saisies · la source reste toujours visible",
    support: "Besoin de quelqu’un ?",
    supportBody:
      "Choisis une demande précise. Aucun signal n’est envoyé automatiquement.",
    ask: "Demander un soutien",
    error: "Le point n’a pas pu être enregistré. Rien n’a été effacé.",
  },
  en: {
    hello: "Hello",
    promise: "One thing is enough today.",
    eyebrow: "Your daily check-in",
    question: "How is the day going?",
    duration: "10 to 20 seconds, or simply let us know you are here.",
    quick: "Do a quick check-in",
    presence: "I’m here",
    presenceSaved: "Noted.",
    saved: "Your check-in is saved.",
    stopHere: "You kept the thread. You can stop here.",
    noPreset: "No value is selected for you.",
    moral: "Mood",
    moralHint: "From very heavy to very light",
    energy: "Energy",
    energyHint: "From slowed down to full of drive",
    irritability: "Irritability",
    irritabilityHint: "From calm to highly sensitive",
    anxiety: "Anxiety, if useful",
    anxietyHint: "From barely present to very present",
    addContext: "Add context",
    note: "A note, if it helps",
    notePlaceholder: "What you may want to find again later…",
    save: "Save my check-in",
    saving: "Saving…",
    back: "Back",
    optional: "optional",
    scaleLow: "low",
    scaleHigh: "high",
    next: "Next step",
    careTitle: "Prepare your next appointment",
    careEmpty: "Add an appointment to gather your questions in one place.",
    prepare: "Open Care",
    available: "Available landmarks",
    source: "Entered data · its source always stays visible",
    support: "Need someone?",
    supportBody: "Choose a specific request. Nothing is sent automatically.",
    ask: "Ask for support",
    error: "The check-in could not be saved. Nothing was erased.",
  },
} as const;

type TodayViewProps = {
  firstName: string;
  dateLabel: string;
  localDate: string;
  timezone: string;
  locale: "fr" | "en";
  initialCheckIn: { depth: "presence" | "quick" | "complete" } | null;
  nextAppointment: { title: string; dateLabel: string } | null;
};

export function TodayView({
  firstName,
  dateLabel,
  localDate,
  timezone,
  locale,
  initialCheckIn,
  nextAppointment,
}: TodayViewProps) {
  const labels = copy[locale];
  const router = useRouter();
  const [mode, setMode] = useState<CheckInMode>(
    initialCheckIn ? "done" : "idle",
  );
  const [savedDepth, setSavedDepth] = useState(initialCheckIn?.depth);
  const [scores, setScores] = useState<Scores>({});
  const [note, setNote] = useState("");

  const { execute, isPending } = useAction(createV2CheckIn, {
    onSuccess: ({ data }) => {
      setSavedDepth(data.depth);
      setMode("done");
      router.refresh();
    },
    onError: () => toast.error(labels.error),
  });

  const coreComplete = useMemo(
    () =>
      scores.valence !== undefined &&
      scores.activation !== undefined &&
      scores.irritability !== undefined,
    [scores],
  );

  const submit = (depth: "presence" | "quick" | "complete") => {
    execute({
      operationId: crypto.randomUUID(),
      depth,
      localDate,
      timezone,
      valence: scores.valence,
      activation: scores.activation,
      irritability: scores.irritability,
      anxiety: depth === "complete" ? scores.anxiety : undefined,
      contexts: [],
      note: depth === "complete" && note.trim() ? note.trim() : undefined,
    });
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 pb-10 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
      <section className="space-y-5">
        <header className="px-1 py-3 sm:py-6">
          <p className="text-primary mb-3 text-xs font-bold tracking-[0.16em] uppercase">
            {dateLabel}
          </p>
          <h1 className="font-[family-name:var(--font-caption)] text-4xl leading-none font-bold tracking-[-0.04em] text-[#18312f] sm:text-6xl">
            {labels.hello}, {firstName}.
          </h1>
          <p className="mt-4 text-base text-[#61716f] sm:text-lg">
            {labels.promise}
          </p>
        </header>

        <article className="overflow-hidden rounded-[28px] border border-[#dbe4df] bg-[#fffdf8] shadow-[0_18px_50px_rgba(24,49,47,0.07)]">
          <div className="relative min-h-48 overflow-hidden border-b border-[#e4e9e5] bg-[linear-gradient(135deg,#e2efeb_0%,#f5eadf_100%)] px-5 py-5 sm:px-8 sm:py-7 sm:pr-64">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
                <Leaf className="size-4" aria-hidden="true" />
                {labels.eyebrow}
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#18312f] sm:text-3xl">
                {mode === "done"
                  ? savedDepth === "presence"
                    ? labels.presenceSaved
                    : labels.saved
                  : labels.question}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#61716f] sm:text-base">
                {mode === "done" ? labels.stopHere : labels.duration}
              </p>
            </div>
            <BrandIllustration
              variant="checkIn"
              sizes="240px"
              className="absolute -right-5 -bottom-16 hidden w-64 rotate-3 sm:block"
            />
          </div>

          <div className="p-5 sm:p-8">
            {mode === "idle" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  className="min-h-13 rounded-2xl bg-[#1e7775] px-5 text-base font-bold hover:bg-[#155c5a]"
                  size="lg"
                  onClick={() => setMode("quick")}
                >
                  <Sparkles className="size-5" aria-hidden="true" />
                  {labels.quick}
                </Button>
                <Button
                  className="min-h-13 rounded-2xl border-[#cad8d2] bg-white px-5 text-base font-bold text-[#155c5a] hover:bg-[#f2f7f5]"
                  variant="outline"
                  size="lg"
                  disabled={isPending}
                  onClick={() => submit("presence")}
                >
                  <Check className="size-5" aria-hidden="true" />
                  {labels.presence}
                </Button>
              </div>
            ) : null}

            {mode === "quick" || mode === "complete" ? (
              <div className="space-y-7">
                <DimensionScale
                  label={labels.moral}
                  hint={labels.moralHint}
                  lowLabel={labels.scaleLow}
                  highLabel={labels.scaleHigh}
                  value={scores.valence}
                  onChange={(value) =>
                    setScores((current) => ({ ...current, valence: value }))
                  }
                />
                <DimensionScale
                  label={labels.energy}
                  hint={labels.energyHint}
                  lowLabel={labels.scaleLow}
                  highLabel={labels.scaleHigh}
                  value={scores.activation}
                  onChange={(value) =>
                    setScores((current) => ({ ...current, activation: value }))
                  }
                />
                <DimensionScale
                  label={labels.irritability}
                  hint={labels.irritabilityHint}
                  lowLabel={labels.scaleLow}
                  highLabel={labels.scaleHigh}
                  value={scores.irritability}
                  onChange={(value) =>
                    setScores((current) => ({
                      ...current,
                      irritability: value,
                    }))
                  }
                />

                {mode === "complete" ? (
                  <div className="space-y-7 border-t border-[#e4e9e5] pt-7">
                    <DimensionScale
                      optional
                      label={labels.anxiety}
                      hint={labels.anxietyHint}
                      lowLabel={labels.scaleLow}
                      highLabel={labels.scaleHigh}
                      value={scores.anxiety}
                      onChange={(value) =>
                        setScores((current) => ({ ...current, anxiety: value }))
                      }
                    />
                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-[#18312f]">
                        {labels.note}{" "}
                        <span className="font-normal text-[#61716f]">
                          ({labels.optional})
                        </span>
                      </span>
                      <Textarea
                        value={note}
                        maxLength={2000}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={labels.notePlaceholder}
                        className="min-h-24 rounded-2xl border-[#cad8d2] bg-white p-4 focus-visible:ring-[#1e7775]/30"
                      />
                    </label>
                  </div>
                ) : null}

                <p className="flex items-center gap-2 text-sm text-[#61716f]">
                  <CircleHelp className="size-4 shrink-0" aria-hidden="true" />
                  {labels.noPreset}
                </p>
                <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9e5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="ghost"
                    className="min-h-11 rounded-xl text-[#61716f]"
                    onClick={() =>
                      setMode(mode === "complete" ? "quick" : "idle")
                    }
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    {labels.back}
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {mode === "quick" ? (
                      <Button
                        variant="outline"
                        className="min-h-11 rounded-xl border-[#cad8d2] bg-white text-[#155c5a]"
                        onClick={() => setMode("complete")}
                      >
                        {labels.addContext}
                      </Button>
                    ) : null}
                    <Button
                      className="min-h-11 rounded-xl bg-[#1e7775] px-6 font-bold hover:bg-[#155c5a]"
                      disabled={!coreComplete || isPending}
                      onClick={() =>
                        submit(mode === "complete" ? "complete" : "quick")
                      }
                    >
                      {isPending ? labels.saving : labels.save}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "done" ? (
              <div className="flex min-h-20 items-center gap-4 text-[#18312f]">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#dcede8] text-[#1e7775]">
                  <Check className="size-6" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-[#61716f]">
                  {labels.stopHere}
                </p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <aside className="space-y-4 xl:pt-36">
        <IntentCard
          eyebrow={labels.next}
          icon={CalendarDays}
          title={nextAppointment?.title ?? labels.careTitle}
          description={nextAppointment?.dateLabel ?? labels.careEmpty}
          href="/consultation"
          action={labels.prepare}
          tone="apricot"
        />
        <IntentCard
          icon={MoonStar}
          title={labels.available}
          description={labels.source}
          href="/trends"
          action={locale === "fr" ? "Voir mes repères" : "View my landmarks"}
          tone="lavender"
        />
        <IntentCard
          icon={HeartHandshake}
          title={labels.support}
          description={labels.supportBody}
          href="/caregiver"
          action={labels.ask}
          tone="sage"
        />
        <div className="flex items-center gap-2 px-2 text-xs text-[#61716f]">
          <Cloud className="size-4" aria-hidden="true" />
          {locale === "fr" ? "Synchronisation prête" : "Sync ready"}
        </div>
      </aside>
    </div>
  );
}

function DimensionScale({
  label,
  hint,
  lowLabel,
  highLabel,
  value,
  optional = false,
  onChange,
}: {
  label: string;
  hint: string;
  lowLabel: string;
  highLabel: string;
  value?: number;
  optional?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="w-full">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-base font-bold text-[#18312f]">{label}</span>
          <span className="text-xs text-[#61716f]">
            {optional ? "Facultatif" : hint}
          </span>
        </span>
      </legend>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {scaleValues.map((scaleValue) => {
          const selected = value === scaleValue;
          return (
            <button
              key={scaleValue}
              type="button"
              aria-label={`${label}: ${scaleValue} sur 10`}
              aria-pressed={selected}
              onClick={() => onChange(scaleValue)}
              className={cn(
                "focus-visible:ring-focus-ring min-h-11 rounded-xl border text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                selected
                  ? "border-[#1e7775] bg-[#1e7775] text-white"
                  : "border-[#d5ded9] bg-white text-[#435754] hover:border-[#1e7775] hover:bg-[#eef6f3]",
              )}
            >
              {scaleValue}
            </button>
          );
        })}
      </div>
      <div
        className="flex justify-between text-[11px] text-[#73817f]"
        aria-hidden="true"
      >
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}

function IntentCard({
  eyebrow,
  icon: Icon,
  title,
  description,
  href,
  action,
  tone,
}: {
  eyebrow?: string;
  icon: typeof CalendarDays;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: "apricot" | "lavender" | "sage";
}) {
  const toneClass = {
    apricot: "bg-[#f6e4d4] text-[#744c30]",
    lavender: "bg-[#ebe6f3] text-[#5c4d72]",
    sage: "bg-[#e3eee7] text-[#37624d]",
  }[tone];

  return (
    <article className="rounded-[22px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_10px_30px_rgba(24,49,47,0.045)]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            toneClass,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-bold tracking-[0.12em] text-[#1e7775] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-bold tracking-[-0.01em] text-[#18312f]">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#61716f]">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className="mt-4 flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-bold text-[#155c5a] transition-colors hover:bg-[#edf5f2] focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:outline-none"
      >
        {action}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

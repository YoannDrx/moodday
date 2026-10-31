"use client";

import { Bouyotte, type BouyotteMood } from "@/components/brand/bouyotte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MooddayRole } from "@moodday/contracts";
import {
  addDays,
  allyLessons,
  needCatalog,
  sharingLevels,
  suggestGestures,
  symptomCatalog,
} from "@moodday/domain";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  PauseCircle,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acceptInviteAction,
  chooseRoleAction,
  completeOwnerOnboardingAction,
  completeSupporterOnboardingAction,
} from "../couple.action";
import { Chip } from "./check-in-form";

const focusOptions = [
  { key: "understand", label: "Comprendre ce qui se passe vraiment" },
  { key: "words", label: "Savoir quoi dire (et quoi éviter)" },
  { key: "help", label: "Aider concrètement, sans en faire trop" },
  { key: "arguments", label: "Éviter la dispute du mois" },
  { key: "serious", label: "Repérer quand ça devient sérieux" },
];

const todayIso = () => new Date().toLocaleDateString("en-CA");

const periodShortcuts = [
  { label: "Aujourd'hui", days: 0 },
  { label: "Il y a une semaine", days: 7 },
  { label: "Il y a deux semaines", days: 14 },
  { label: "Il y a trois semaines", days: 21 },
];

type StepDefinition = {
  key: string;
  title: string;
  hint?: string;
  mood: BouyotteMood;
  body: React.ReactNode;
  canContinue?: boolean;
};

function StepFrame({
  step,
  index,
  total,
}: {
  step: StepDefinition;
  index: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Bouyotte mood={step.mood} className="size-16 shrink-0" />
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Étape {index + 1} sur {total}
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{step.title}</h1>
        </div>
      </div>
      {step.hint && (
        <p className="text-muted-foreground text-lg">{step.hint}</p>
      )}
      {step.body}
    </div>
  );
}

export function OnboardingFlow({
  initialRole,
  roleConfirmed,
  suggestedName,
}: {
  initialRole: MooddayRole | null;
  roleConfirmed: boolean;
  suggestedName: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<MooddayRole | null>(
    roleConfirmed ? initialRole : null,
  );
  const [preselected, setPreselected] = useState<MooddayRole | null>(
    initialRole,
  );
  const [step, setStep] = useState(0);
  const [name, setName] = useState(suggestedName);
  const [lastPeriod, setLastPeriod] = useState<string>("");
  const [unknownDate, setUnknownDate] = useState(false);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [hardest, setHardest] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggle = (list: string[], key: string, limit: number) =>
    list.includes(key)
      ? list.filter((item) => item !== key)
      : list.length >= limit
        ? list
        : [...list, key];

  const confirmRole = (next: MooddayRole) =>
    startTransition(async () => {
      const result = await chooseRoleAction({ role: next });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      setRole(next);
      setStep(0);
    });

  const finishOwner = (destination: "/today" | "/duo") =>
    startTransition(async () => {
      const result = await completeOwnerOnboardingAction({
        displayName: name.trim(),
        lastPeriodStart: unknownDate || !lastPeriod ? null : lastPeriod,
        typicalCycleLength: cycleLength,
        typicalPeriodLength: periodLength,
        hardestThings: hardest,
        usualNeeds: needs,
      });
      if (result.serverError || result.validationErrors) {
        toast.error(result.serverError ?? "Vérifie les informations saisies.");
        return;
      }
      toast.success(`Bienvenue, ${name.trim()}. On fait ton premier point ?`);
      router.push(destination);
      router.refresh();
    });

  const finishSupporter = () =>
    startTransition(async () => {
      const result = await completeSupporterOnboardingAction({
        displayName: name.trim(),
        supporterFocus: focus,
      });
      if (result.serverError || result.validationErrors) {
        toast.error(result.serverError ?? "Choisis au moins une réponse.");
        return;
      }
      if (code.replace("-", "").length >= 8) {
        const joined = await acceptInviteAction({ code });
        if (joined.serverError || joined.validationErrors) {
          toast.error(
            `${joined.serverError ?? "Ce code ne marche pas."} Tu pourras le saisir depuis Duo.`,
          );
        } else {
          toast.success(
            "Duo formé. Commence par le jour 1, ça prend deux minutes.",
          );
        }
      }
      router.push(`/ally/${allyLessons[0].slug}`);
      router.refresh();
    });

  if (!role) {
    return (
      <section className="sticker flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Bouyotte mood="happy" steam className="size-20" />
          <div>
            <p className="text-muted-foreground text-sm font-bold">
              Une minute, et on est au chaud.
            </p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Bienvenue ! Tu es de quel côté du duo ?
            </h1>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              value: "cycle_owner" as const,
              title: "C'est mon cycle",
              text: "Je fais mon point en dix secondes et je choisis ce que je partage.",
              mood: "fragile" as const,
            },
            {
              value: "supporter" as const,
              title: "C'est le cycle de ma ou mon partenaire",
              text: "Je veux comprendre, et savoir quoi faire (et quoi ne pas dire).",
              mood: "wink" as const,
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={preselected === option.value}
              onClick={() => setPreselected(option.value)}
              className={cn(
                "flex flex-col gap-2 rounded-3xl border-2 border-[var(--ink)] p-5 text-left transition",
                preselected === option.value
                  ? "bg-honey shadow-sticker text-[#2b1b30]"
                  : "bg-card hover:-translate-y-0.5",
              )}
            >
              <Bouyotte mood={option.mood} className="size-12" />
              <span className="font-display text-xl font-extrabold">
                {option.title}
              </span>
              <span className="text-sm">{option.text}</span>
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          Un compte, un côté. Tu pourras changer plus tard tant que tu n'es pas
          relié·e à quelqu'un.
        </p>
        <Button
          size="lg"
          disabled={!preselected || isPending}
          onClick={() => preselected && confirmRole(preselected)}
        >
          Continuer <ArrowRight />
        </Button>
      </section>
    );
  }

  const nameStep: StepDefinition = {
    key: "name",
    title: "Comment on t'appelle ?",
    hint:
      role === "cycle_owner"
        ? "C'est ce que verra ton duo. Un surnom marche très bien."
        : "C'est ce que verra ta ou ton partenaire.",
    mood: "happy",
    canContinue: name.trim().length > 0,
    body: (
      <Input
        aria-label="Prénom ou surnom"
        value={name}
        maxLength={40}
        autoFocus
        onChange={(event) => setName(event.target.value)}
      />
    ),
  };

  const exampleGestures = suggestGestures(needs, "fragile", 2);

  const ownerSteps: StepDefinition[] = [
    nameStep,
    {
      key: "period",
      title: "Tes dernières règles ont commencé quand ?",
      hint: "Une date approximative suffit : Moodday s'affine à chaque cycle.",
      mood: "sleepy",
      body: (
        <>
          <div className="flex flex-wrap gap-2">
            {periodShortcuts.map((shortcut) => {
              const value = addDays(todayIso(), -shortcut.days);
              return (
                <Chip
                  key={shortcut.label}
                  selected={!unknownDate && lastPeriod === value}
                  onClick={() => {
                    setUnknownDate(false);
                    setLastPeriod(value);
                  }}
                >
                  {shortcut.label}
                </Chip>
              );
            })}
          </div>
          <Input
            type="date"
            aria-label="Date du début des dernières règles"
            max={todayIso()}
            value={lastPeriod}
            disabled={unknownDate}
            onChange={(event) => setLastPeriod(event.target.value)}
          />
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              className="size-4 accent-[var(--ink)]"
              checked={unknownDate}
              onChange={(event) => setUnknownDate(event.target.checked)}
            />
            Je ne sais plus, je la noterai la prochaine fois
          </label>
        </>
      ),
    },
    {
      key: "rhythm",
      title: "Ton rythme habituel",
      hint: "Pas sûre ? Laisse les valeurs par défaut, Moodday apprendra de tes règles.",
      mood: "ok",
      body: (
        <>
          <label className="flex flex-col gap-2 font-bold">
            Durée d'un cycle : {cycleLength} jours
            <input
              type="range"
              min={21}
              max={45}
              value={cycleLength}
              onChange={(event) => setCycleLength(Number(event.target.value))}
              className="accent-[var(--ink)]"
            />
          </label>
          <label className="flex flex-col gap-2 font-bold">
            Durée des règles : {periodLength} jours
            <input
              type="range"
              min={2}
              max={10}
              value={periodLength}
              onChange={(event) => setPeriodLength(Number(event.target.value))}
              className="accent-[var(--ink)]"
            />
          </label>
        </>
      ),
    },
    {
      key: "hard",
      title: "Avant tes règles, qu'est-ce qui est le plus dur ?",
      hint: "Trois maximum. On les mettra en tête de ton point du jour.",
      mood: "hard",
      body: (
        <div className="flex flex-wrap gap-2">
          {symptomCatalog.map((symptom) => (
            <Chip
              key={symptom.key}
              selected={hardest.includes(symptom.key)}
              onClick={() => setHardest((list) => toggle(list, symptom.key, 3))}
            >
              {symptom.label}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "needs",
      title: "Et dans ces moments-là, de quoi as-tu besoin ?",
      hint: "Ton duo recevra des idées de gestes à partir de ça.",
      mood: "fragile",
      body: (
        <>
          <div className="flex flex-wrap gap-2">
            {needCatalog.map((need) => (
              <Chip
                key={need.key}
                selected={needs.includes(need.key)}
                onClick={() => setNeeds((list) => toggle(list, need.key, 4))}
              >
                {need.label}
              </Chip>
            ))}
          </div>
          {needs.length > 0 && (
            <p className="bg-mint-soft rounded-2xl border-2 border-dashed border-[var(--ink)] px-3 py-2 text-sm">
              Par exemple, ton duo pourra te répondre :{" "}
              {exampleGestures
                .map((gesture) => `« ${gesture.label} »`)
                .join(" ou ")}
              .
            </p>
          )}
        </>
      ),
    },
    {
      key: "duo",
      title: "Et ton duo, dans tout ça ?",
      hint: "Tu peux inviter quelqu'un maintenant, plus tard, ou jamais. Moodday marche aussi en solo.",
      mood: "wink",
      body: (
        <div className="grid gap-3">
          <div className="bg-card rounded-2xl border-2 border-[var(--ink)] p-4">
            <p className="flex items-center gap-2 font-bold">
              <Eye className="size-4" aria-hidden /> Par défaut, il ou elle
              verra
            </p>
            <p className="mt-1 text-sm">
              {sharingLevels.cycle_state_needs.description}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Tu pourras choisir «{" "}
              {sharingLevels.cycle_only.label.toLowerCase()} » ou «{" "}
              {sharingLevels.cycle_state.label.toLowerCase()} » avant même qu'il
              ou elle n'arrive.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm font-semibold">
            <li className="flex items-center gap-2">
              <Lock className="size-4" aria-hidden /> Ta note du jour reste
              toujours privée.
            </li>
            <li className="flex items-center gap-2">
              <PauseCircle className="size-4" aria-hidden /> Pause 48 h ou arrêt
              du partage, sans te justifier.
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4" aria-hidden /> Personne ne saisit rien à
              ta place.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const supporterSteps: StepDefinition[] = [
    nameStep,
    {
      key: "focus",
      title: "Qu'est-ce que tu aimerais mieux comprendre ?",
      hint: "Trois choix maximum. Aucune mauvaise réponse, promis.",
      mood: "wink",
      canContinue: focus.length > 0,
      body: (
        <div className="flex flex-col gap-2">
          {focusOptions.map((option) => (
            <Chip
              key={option.key}
              selected={focus.includes(option.key)}
              onClick={() => setFocus((list) => toggle(list, option.key, 3))}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "rules",
      title: "Les règles du jeu",
      hint: "Trois principes, et tout le reste en découle.",
      mood: "ok",
      body: (
        <ol className="flex flex-col gap-3">
          {[
            [
              "C'est elle qui décide.",
              "Ce que tu vois, quand, et pour combien de temps.",
            ],
            [
              "Tu ne saisis rien sur elle.",
              "Ni dates, ni humeur. Ton rôle : comprendre et répondre.",
            ],
            [
              "Le calendrier n'est pas une météo.",
              "Seul son point du jour dit comment elle va.",
            ],
          ].map(([title, text], index) => (
            <li
              key={title}
              className="bg-card flex gap-3 rounded-2xl border-2 border-[var(--ink)] p-3"
            >
              <span className="bg-honey font-display flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] font-extrabold">
                {index + 1}
              </span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className="text-sm">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "code",
      title: "Elle t'a déjà envoyé un code ?",
      hint: "Sinon, aucun souci : tu pourras l'inviter depuis l'onglet Duo. Le Programme Allié t'attend dans tous les cas.",
      mood: "happy",
      body: (
        <>
          <label htmlFor="onboarding-code" className="font-bold">
            Code d'invitation (facultatif)
          </label>
          <Input
            id="onboarding-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ABCD-EFGH"
            autoComplete="off"
            maxLength={9}
            className="font-display text-lg tracking-widest uppercase"
          />
        </>
      ),
    },
  ];

  const steps = role === "cycle_owner" ? ownerSteps : supporterSteps;
  const current = steps[step] ?? steps[0];
  const last = step === steps.length - 1;
  const canContinue = current.canContinue ?? true;

  return (
    <section className="sticker flex flex-col gap-6 p-6 sm:p-8">
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={step + 1}
        aria-label="Progression"
      >
        {steps.map((item, index) => (
          <span
            key={item.key}
            className={cn(
              "h-2 flex-1 rounded-full border border-[var(--ink)]",
              index <= step ? "bg-[var(--ink)]" : "bg-card",
            )}
          />
        ))}
      </div>
      <StepFrame step={current} index={step} total={steps.length} />
      <div className="flex flex-wrap justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? setRole(null) : setStep(step - 1))}
          disabled={isPending || (step === 0 && roleConfirmed)}
        >
          <ArrowLeft /> Retour
        </Button>
        {!last && (
          <Button
            disabled={!canContinue || isPending}
            onClick={() => setStep(step + 1)}
          >
            Continuer <ArrowRight />
          </Button>
        )}
        {last && role === "cycle_owner" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => finishOwner("/today")}
            >
              Plus tard, faire mon premier point
            </Button>
            <Button
              variant="honey"
              disabled={isPending}
              onClick={() => finishOwner("/duo")}
            >
              Inviter mon duo <ArrowRight />
            </Button>
          </div>
        )}
        {last && role === "supporter" && (
          <Button
            variant="honey"
            disabled={isPending}
            onClick={finishSupporter}
          >
            {code.replace("-", "").length >= 8
              ? "Rejoindre et commencer le jour 1"
              : "Commencer le jour 1"}
            <ArrowRight />
          </Button>
        )}
      </div>
    </section>
  );
}

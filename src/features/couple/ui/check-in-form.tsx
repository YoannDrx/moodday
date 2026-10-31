"use client";

import { Bouyotte } from "@/components/brand/bouyotte";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queueAction } from "@/features/pwa/offline-actions";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { CheckInDto } from "@moodday/contracts";
import {
  checkInStates,
  needCatalog,
  stateCatalog,
  symptomCatalog,
  type CheckInStateKey,
} from "@moodday/domain";
import { Lock } from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCheckInAction } from "../couple.action";

const MAX_NEEDS = 2;
const stateFill: Record<CheckInStateKey, string> = {
  ok: "bg-mint",
  fragile: "bg-honey",
  hard: "bg-apricot",
  very_hard: "bg-plum-soft",
};
const VISIBLE_SYMPTOMS = 6;

export function Chip({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border-2 border-[var(--ink)] px-3 py-1.5 text-sm font-bold transition disabled:opacity-40",
        selected ? "bg-honey text-[#2b1b30]" : "bg-card hover:bg-accent",
      )}
    >
      {selected && <span aria-hidden>✓ </span>}
      {children}
    </button>
  );
}

export function CheckInForm({
  localDate,
  timeZone,
  partnerName,
  showsNeedsToPartner,
  initial,
  customNeeds,
  onDone,
}: {
  localDate: string;
  timeZone: string;
  partnerName: string | null;
  showsNeedsToPartner: boolean;
  initial: CheckInDto | null;
  customNeeds: { id: string; label: string }[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [state, setState] = useState<CheckInStateKey | null>(
    initial?.state ?? null,
  );
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [needs, setNeeds] = useState<string[]>(initial?.needs ?? []);
  const [note, setNote] = useState(initial?.privateNote ?? "");
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allNeeds = [
    ...needCatalog,
    ...customNeeds.map((need) => ({
      key: `custom:${need.id}`,
      label: need.label,
    })),
  ];
  const toggle = (list: string[], key: string, limit?: number) =>
    list.includes(key)
      ? list.filter((item) => item !== key)
      : limit && list.length >= limit
        ? list
        : [...list, key];

  const save = () => {
    if (!state) return;
    const payload = {
      localDate,
      timezone: timeZone,
      state,
      symptoms,
      needs,
      privateNote: note.trim() || null,
    };
    startTransition(async () => {
      const queueOffline = async () => {
        if (!session?.user.id) throw new Error("no_session");
        await queueAction(session.user.id, {
          type: "check_in",
          ...payload,
          privateNote: payload.privateNote ?? undefined,
        });
        toast.success(
          "Hors ligne : ton point partira dès le retour du réseau.",
        );
        onDone?.();
      };
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await queueOffline();
          return;
        }
        const result = await saveCheckInAction({
          operationId: nanoid(16),
          ...payload,
        });
        if (result.serverError || result.validationErrors) {
          toast.error(
            result.serverError ?? "Quelque chose cloche dans ce point.",
          );
          return;
        }
        toast.success(
          partnerName && showsNeedsToPartner
            ? `C'est noté. ${partnerName} est prévenu·e en douceur.`
            : "C'est noté. Prends soin de toi.",
        );
        onDone?.();
        router.refresh();
      } catch {
        try {
          await queueOffline();
        } catch {
          toast.error("Impossible d'enregistrer pour l'instant. Réessaie ?");
        }
      }
    });
  };

  const symptomList = showAllSymptoms
    ? symptomCatalog
    : symptomCatalog.filter(
        (symptom, index) =>
          index < VISIBLE_SYMPTOMS || symptoms.includes(symptom.key),
      );
  const previewNeed = needs[0]
    ? allNeeds.find((need) => need.key === needs[0])?.label
    : null;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <fieldset>
        <legend className="font-display text-2xl font-extrabold">
          Comment tu te sens ?
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {checkInStates.map((key) => {
            const selected = state === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setState(key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-3xl border-2 border-[var(--ink)] p-3 text-center transition",
                  selected
                    ? cn(
                        "shadow-sticker -translate-y-0.5 text-[#2b1b30]",
                        stateFill[key],
                      )
                    : "bg-card hover:-translate-y-0.5",
                )}
              >
                <Bouyotte
                  mood={key}
                  className={cn("size-14", selected && "animate-wobble")}
                />
                <span className="font-bold">{stateCatalog[key].label}</span>
                <span
                  className={cn(
                    "text-xs",
                    selected ? "" : "text-muted-foreground",
                  )}
                >
                  {stateCatalog[key].hint}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bold">
          Ton corps et ta tête{" "}
          <span className="text-muted-foreground font-normal">
            (facultatif)
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {symptomList.map((symptom) => (
            <Chip
              key={symptom.key}
              selected={symptoms.includes(symptom.key)}
              onClick={() =>
                setSymptoms((list) => toggle(list, symptom.key, 6))
              }
            >
              {symptom.label}
            </Chip>
          ))}
          {!showAllSymptoms && (
            <button
              type="button"
              className="text-sm font-bold underline underline-offset-4"
              onClick={() => setShowAllSymptoms(true)}
            >
              Plus…
            </button>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bold">
          Ce qui t'aiderait{" "}
          <span className="text-muted-foreground font-normal">
            (deux maximum)
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {allNeeds.map((need) => (
            <Chip
              key={need.key}
              selected={needs.includes(need.key)}
              disabled={!needs.includes(need.key) && needs.length >= MAX_NEEDS}
              onClick={() =>
                setNeeds((list) => toggle(list, need.key, MAX_NEEDS))
              }
            >
              {need.label}
            </Chip>
          ))}
        </div>
        {partnerName && (
          <p className="bg-mint-soft mt-3 rounded-2xl border-2 border-dashed border-[var(--ink)] px-3 py-2 text-sm">
            {showsNeedsToPartner
              ? previewNeed
                ? `${partnerName} verra : « ${previewNeed.toLowerCase()} ».`
                : `${partnerName} verra ton état du jour.`
              : `Avec ton niveau de partage, ${partnerName} ne voit pas tes besoins.`}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="private-note"
          className="flex items-center gap-2 font-bold"
        >
          <Lock className="size-4" aria-hidden />
          Note privée
        </label>
        <Textarea
          id="private-note"
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Rien que pour toi. Jamais partagée, avec personne."
        />
      </div>

      <Button
        type="submit"
        size="lg"
        variant="honey"
        disabled={!state || isPending}
      >
        {isPending
          ? "Enregistrement…"
          : initial
            ? "Mettre à jour mon point"
            : "Enregistrer mon point"}
      </Button>
    </form>
  );
}

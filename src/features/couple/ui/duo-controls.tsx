"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { SharingLevel } from "@moodday/contracts";
import { sharingLevels } from "@moodday/domain";
import { Copy, PauseCircle, PlayCircle, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acceptInviteAction,
  cancelInviteAction,
  createInviteAction,
  endLinkAction,
  pauseSharingAction,
  resumeSharingAction,
  updateSharingAction,
} from "../couple.action";

const useAction = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (
    operation: () => Promise<{
      serverError?: string;
      validationErrors?: unknown;
    }>,
    success?: string,
  ) =>
    startTransition(async () => {
      const result = await operation();
      if (result.serverError || result.validationErrors) {
        toast.error(
          result.serverError ?? "Ça n'a pas marché. Vérifie et réessaie.",
        );
        return;
      }
      if (success) toast.success(success);
      router.refresh();
    });
  return { isPending, run };
};

export function InviteCard({
  role,
  hasPendingInvite,
}: {
  role: "cycle_owner" | "supporter";
  hasPendingInvite: boolean;
}) {
  const [code, setCode] = useState<string | null>(null);
  const { isPending, run } = useAction();
  const router = useRouter();
  const [creating, startCreate] = useTransition();

  const message =
    role === "cycle_owner"
      ? `J'utilise Moodday pour mieux vivre mon SPM, à deux. Rejoins-moi avec ce code : ${code}`
      : `J'ai commencé un programme pour mieux comprendre ton cycle. Tu veux qu'on essaie ensemble ? Crée ton espace sur Moodday et entre ce code : ${code}`;

  const create = () =>
    startCreate(async () => {
      const result = await createInviteAction();
      if (!result.data) {
        toast.error(result.serverError ?? "Impossible de créer un code.");
        return;
      }
      setCode(result.data.code);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      {code ? (
        <>
          <p className="text-muted-foreground text-sm">
            Valable 7 jours, utilisable une seule fois.
          </p>
          <p
            className="bg-honey font-display shadow-sticker w-fit rounded-2xl border-2 border-[var(--ink)] px-5 py-3 text-4xl font-extrabold tracking-[0.15em]"
            aria-label={`Code d'invitation ${code.split("").join(" ")}`}
          >
            {code}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(message);
                toast.success("Message copié.");
              }}
            >
              <Copy />
              Copier le message
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button
                variant="outline"
                onClick={async () =>
                  navigator
                    .share({ text: message, title: "Moodday" })
                    .catch(() => undefined)
                }
              >
                <Share2 />
                Partager
              </Button>
            )}
          </div>
          <p className="bg-mint-soft rounded-2xl border-2 border-dashed border-[var(--ink)] p-3 text-sm">
            {message}
          </p>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="honey" onClick={create} disabled={creating}>
            {hasPendingInvite
              ? "Générer un nouveau code"
              : "Créer un code d'invitation"}
          </Button>
          {hasPendingInvite && (
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                run(async () => cancelInviteAction(), "Invitation annulée.")
              }
            >
              Annuler l'invitation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function AcceptCodeForm({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const { isPending, run } = useAction();
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          async () => acceptInviteAction({ code }),
          "Duo formé. Bienvenue à deux !",
        );
      }}
    >
      <label htmlFor="invite-code" className="sr-only">
        Code d'invitation
      </label>
      <Input
        id="invite-code"
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        placeholder="ABCD-EFGH"
        autoComplete="off"
        className="font-display text-lg tracking-widest uppercase"
        maxLength={9}
      />
      <Button
        type="submit"
        disabled={isPending || code.replace("-", "").length < 8}
      >
        Rejoindre
      </Button>
    </form>
  );
}

const previewFor = (
  level: SharingLevel,
  shareSymptoms: boolean,
  ownerName: string,
) => {
  const lines = ["Ta phase du cycle et la date approximative de tes règles"];
  if (level !== "cycle_only")
    lines.push(
      `Ton état du jour, quand tu fais ton point (ex. « ${ownerName} : fragile »)`,
    );
  if (level === "cycle_state_needs")
    lines.push("Tes besoins du jour et des idées de gestes");
  if (shareSymptoms && level !== "cycle_only") lines.push("Tes symptômes");
  return lines;
};

export function SharingSettings({
  partnerName,
  ownerName,
  level: initialLevel,
  shareSymptoms: initialSymptoms,
  detailedPreviews: initialPreviews,
}: {
  partnerName: string;
  ownerName: string;
  level: SharingLevel;
  shareSymptoms: boolean;
  detailedPreviews: boolean;
}) {
  const [level, setLevel] = useState(initialLevel);
  const [shareSymptoms, setShareSymptoms] = useState(initialSymptoms);
  const [detailedPreviews, setDetailedPreviews] = useState(initialPreviews);
  const { isPending, run } = useAction();
  const dirty =
    level !== initialLevel ||
    shareSymptoms !== initialSymptoms ||
    detailedPreviews !== initialPreviews;

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Ce que {partnerName} voit</legend>
        {(Object.keys(sharingLevels) as SharingLevel[]).map((key) => (
          <label
            key={key}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-[var(--ink)] p-3",
              level === key ? "bg-honey text-[#2b1b30]" : "bg-card",
            )}
          >
            <input
              type="radio"
              name="level"
              className="mt-1 size-4 accent-[var(--ink)]"
              checked={level === key}
              onChange={() => setLevel(key)}
            />
            <span>
              <span className="block font-bold">
                {sharingLevels[key].label}
              </span>
              <span className="text-sm">{sharingLevels[key].description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-4 font-semibold">
          <span>
            Partager aussi mes symptômes
            <span className="text-muted-foreground block text-sm font-normal">
              Désactivé par défaut. Crampes, fatigue, irritabilité…
            </span>
          </span>
          <Switch
            checked={shareSymptoms}
            onCheckedChange={setShareSymptoms}
            disabled={level === "cycle_only"}
          />
        </label>
        <label className="flex items-center justify-between gap-4 font-semibold">
          <span>
            Notifications détaillées sur son écran verrouillé
            <span className="text-muted-foreground block text-sm font-normal">
              Sinon : « {ownerName} a partagé son point du jour », rien de plus.
            </span>
          </span>
          <Switch
            checked={detailedPreviews}
            onCheckedChange={setDetailedPreviews}
          />
        </label>
      </div>

      <div className="bg-mint-soft rounded-2xl border-2 border-dashed border-[var(--ink)] p-4">
        <p className="font-bold">Vue de {partnerName}</p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {previewFor(level, shareSymptoms, ownerName).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-semibold">Jamais : ta note privée.</p>
      </div>

      <Button
        variant="honey"
        className="w-fit"
        disabled={!dirty || isPending}
        onClick={() =>
          run(
            async () =>
              updateSharingAction({ level, shareSymptoms, detailedPreviews }),
            "Réglages de partage enregistrés.",
          )
        }
      >
        Enregistrer
      </Button>
    </div>
  );
}

export function PauseControls({ pausedUntil }: { pausedUntil: string | null }) {
  const { isPending, run } = useAction();
  if (pausedUntil) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 font-semibold">
          En pause jusqu'au{" "}
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(pausedUntil))}
          .
        </p>
        <Button
          variant="mint"
          disabled={isPending}
          onClick={() =>
            run(async () => resumeSharingAction(), "Partage repris.")
          }
        >
          <PlayCircle />
          Reprendre maintenant
        </Button>
      </div>
    );
  }
  return (
    <Button
      variant="outline"
      className="w-fit"
      disabled={isPending}
      onClick={() =>
        run(
          async () => pauseSharingAction({ hours: 48 }),
          "Pause de 48 h activée.",
        )
      }
    >
      <PauseCircle />
      Pause 48 h
    </Button>
  );
}

export function EndLinkButton({ partnerName }: { partnerName: string }) {
  const [confirming, setConfirming] = useState(false);
  const { isPending, run } = useAction();
  if (!confirming) {
    return (
      <Button
        variant="ghost"
        className="w-fit underline"
        onClick={() => setConfirming(true)}
      >
        Arrêter le partage
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--ink)] p-4">
      <p>
        {partnerName} perdra l'accès immédiatement et recevra un message neutre,
        sans raison. Votre historique partagé sera masqué.
      </p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={() => run(async () => endLinkAction(), "Partage arrêté.")}
        >
          Oui, arrêter
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

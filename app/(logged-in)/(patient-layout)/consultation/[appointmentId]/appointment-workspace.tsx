"use client";

import type {
  AppointmentArtifactsDto,
  AppointmentBriefDto,
  AppointmentBriefShareDto,
  AppointmentBriefShareDurationHours,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
  CreateAppointmentArtifactInput,
} from "@moodday/contracts";
import {
  Check,
  Copy,
  Download,
  FileText,
  Flag,
  LockKeyhole,
  MessageCircleQuestion,
  Play,
  Share2,
  Square,
  Trash2,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";

type Artifact =
  | AppointmentQuestionDto
  | AppointmentEventDto
  | AppointmentDecisionDto
  | AppointmentBriefDto;

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const makeShareToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
};

export function AppointmentWorkspace({
  appointmentId,
  initialArtifacts,
}: {
  appointmentId: string;
  initialArtifacts: AppointmentArtifactsDto;
}) {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [question, setQuestion] = useState("");
  const [privateNote, setPrivateNote] = useState(false);
  const [decision, setDecision] = useState("");
  const [shares, setShares] = useState<AppointmentBriefShareDto[]>([]);
  const [shareDuration, setShareDuration] =
    useState<AppointmentBriefShareDurationHours>(24);
  const [latestShareUrl, setLatestShareUrl] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const activeBrief = artifacts.briefs.at(0);

  useEffect(() => {
    setLatestShareUrl(undefined);
    if (!activeBrief) {
      setShares([]);
      return;
    }
    const controller = new AbortController();
    void fetch(
      `/api/v2/appointment-briefs/${encodeURIComponent(activeBrief.id)}/shares`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as {
          data: AppointmentBriefShareDto[];
        };
        setShares(body.data);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setShares([]);
        }
      });
    return () => controller.abort();
  }, [activeBrief]);

  const createArtifact = async (input: CreateAppointmentArtifactInput) => {
    const response = await fetch(
      `/api/v2/appointments/${encodeURIComponent(appointmentId)}/artifacts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    const body = (await response.json()) as
      | { data: Artifact }
      | { error: { message: string } };
    if (!response.ok || !("data" in body)) {
      throw new Error(
        "error" in body ? body.error.message : "unexpected_response",
      );
    }
    return body.data;
  };

  const run = (
    input: CreateAppointmentArtifactInput,
    onCreated: (artifact: Artifact) => void,
    successMessage: string,
  ) => {
    setStatus(undefined);
    startTransition(async () => {
      try {
        const artifact = await createArtifact(input);
        onCreated(artifact);
        setStatus(successMessage);
      } catch {
        setStatus("Impossible d’enregistrer pour le moment. Réessaie.");
      }
    });
  };

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = question.trim();
    if (!content) return;
    run(
      {
        kind: "question",
        operationId: makeId("operation"),
        questionId: makeId("question"),
        content,
        privateNote,
      },
      (artifact) => {
        setArtifacts((current) => ({
          ...current,
          questions: [...current.questions, artifact as AppointmentQuestionDto],
        }));
        setQuestion("");
        setPrivateNote(false);
      },
      privateNote ? "Note privée conservée." : "Question ajoutée.",
    );
  };

  const submitDecision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const summary = decision.trim();
    if (!summary) return;
    run(
      {
        kind: "decision",
        operationId: makeId("operation"),
        decisionId: makeId("decision"),
        summary,
        status: "open",
        includeInBrief: true,
      },
      (artifact) => {
        setArtifacts((current) => ({
          ...current,
          decisions: [...current.decisions, artifact as AppointmentDecisionDto],
        }));
        setDecision("");
      },
      "Suite ajoutée au débrief.",
    );
  };

  const addEvent = (type: "session_started" | "session_ended") => {
    run(
      {
        kind: "event",
        operationId: makeId("operation"),
        eventId: makeId("event"),
        type,
        occurredAt: new Date().toISOString(),
      },
      (artifact) =>
        setArtifacts((current) => ({
          ...current,
          events: [...current.events, artifact as AppointmentEventDto],
        })),
      type === "session_started"
        ? "Mode séance démarré."
        : "Fin de séance notée.",
    );
  };

  const createBrief = () => {
    run(
      {
        kind: "brief",
        operationId: makeId("operation"),
        briefId: makeId("brief"),
      },
      (artifact) =>
        setArtifacts((current) => ({
          ...current,
          briefs: [artifact as AppointmentBriefDto, ...current.briefs],
        })),
      "Brief créé sans les notes privées.",
    );
  };

  const createShare = () => {
    if (!activeBrief) return;
    setStatus(undefined);
    startTransition(async () => {
      const token = makeShareToken();
      try {
        const response = await fetch(
          `/api/v2/appointment-briefs/${encodeURIComponent(activeBrief.id)}/shares`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operationId: makeId("operation"),
              shareId: makeId("share"),
              token,
              expiresInHours: shareDuration,
            }),
          },
        );
        const body = (await response.json()) as
          | { data: { share: AppointmentBriefShareDto; token: string } }
          | { error: { code: string; message: string } };
        if (!response.ok || !("data" in body)) {
          if (
            "error" in body &&
            body.error.code === "recent_authentication_required"
          ) {
            setStatus(
              "Reconnecte-toi avant de créer un lien de partage sensible.",
            );
            return;
          }
          throw new Error("share_unavailable");
        }
        const url = `${window.location.origin}/brief#${body.data.token}`;
        setShares((current) => [body.data.share, ...current]);
        setLatestShareUrl(url);
        try {
          await navigator.clipboard.writeText(url);
          setStatus(
            `Lien copié. Il expire le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(body.data.share.expiresAt))}.`,
          );
        } catch {
          setStatus("Lien créé. Copie-le manuellement ci-dessous.");
        }
      } catch {
        setStatus("Impossible de créer ou copier le lien pour le moment.");
      }
    });
  };

  const downloadBrief = () => {
    if (!activeBrief) return;
    setStatus(undefined);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/v2/appointment-briefs/${encodeURIComponent(activeBrief.id)}/pdf?locale=fr`,
          { headers: { Accept: "application/pdf" } },
        );
        if (!response.ok) {
          const body = (await response.json()) as {
            error?: { code?: string };
          };
          if (body.error?.code === "recent_authentication_required") {
            setStatus("Reconnecte-toi avant de télécharger ce brief.");
            return;
          }
          throw new Error("pdf_unavailable");
        }
        const href = URL.createObjectURL(await response.blob());
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = `moodday-brief-v${activeBrief.version}.pdf`;
        anchor.click();
        URL.revokeObjectURL(href);
        setStatus("PDF téléchargé sans les notes privées.");
      } catch {
        setStatus("Impossible de préparer le PDF pour le moment.");
      }
    });
  };

  const revokeShare = (shareId: string) => {
    if (!activeBrief) return;
    setStatus(undefined);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/v2/appointment-briefs/${encodeURIComponent(activeBrief.id)}/shares/${encodeURIComponent(shareId)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const body = (await response.json()) as {
            error?: { code?: string };
          };
          if (body.error?.code === "recent_authentication_required") {
            setStatus("Reconnecte-toi avant de révoquer ce lien.");
            return;
          }
          throw new Error("revoke_unavailable");
        }
        setShares((current) =>
          current.map((share) =>
            share.id === shareId
              ? { ...share, revokedAt: new Date().toISOString() }
              : share,
          ),
        );
        setStatus("Lien révoqué. Il ne donnera plus accès au prochain appel.");
      } catch {
        setStatus("Impossible de révoquer ce lien pour le moment.");
      }
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        icon={<MessageCircleQuestion className="size-5" aria-hidden="true" />}
        eyebrow="Avant"
        title="Questions à garder sous la main"
        description="Une question privée reste visible uniquement ici et n’entre jamais dans le brief."
      >
        <form className="space-y-3" onSubmit={submitQuestion}>
          <label
            className="block text-sm font-bold text-[#18312f]"
            htmlFor="appointment-question"
          >
            Ce que tu veux aborder
          </label>
          <textarea
            id="appointment-question"
            className="min-h-28 w-full resize-y rounded-2xl border border-[#cad8d2] bg-white px-4 py-3 text-base text-[#18312f] outline-none placeholder:text-[#82908e] focus-visible:ring-2 focus-visible:ring-[#166f9e]"
            maxLength={1000}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Par exemple : parler du sommeil depuis le changement de rythme"
            value={question}
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl bg-[#f5f2eb] px-4 py-2 text-sm text-[#465c59]">
            <input
              checked={privateNote}
              className="size-5 accent-[#1e7775]"
              onChange={(event) => setPrivateNote(event.target.checked)}
              type="checkbox"
            />
            <LockKeyhole className="size-4" aria-hidden="true" />
            Garder cette question hors du brief
          </label>
          <ActionButton disabled={!question.trim() || isPending} type="submit">
            Ajouter la question
          </ActionButton>
        </form>

        <ul className="mt-5 space-y-2" aria-label="Questions préparées">
          {artifacts.questions.length > 0 ? (
            artifacts.questions.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-2xl bg-[#f5f7f4] p-4 text-sm leading-6 text-[#294542]"
              >
                {item.privateNote ? (
                  <LockKeyhole
                    className="mt-1 size-4 shrink-0 text-[#744c30]"
                    aria-label="Privée"
                  />
                ) : (
                  <Check
                    className="mt-1 size-4 shrink-0 text-[#1e7775]"
                    aria-hidden="true"
                  />
                )}
                <span>{item.content}</span>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-[#cad8d2] p-4 text-sm text-[#61716f]">
              Rien à préparer pour l’instant. Tu peux revenir plus tard.
            </li>
          )}
        </ul>
      </Panel>

      <Panel
        icon={<Play className="size-5" aria-hidden="true" />}
        eyebrow="Pendant"
        title="Mode séance, sans distraction"
        description="Les repères temporels restent factuels. Aucun contenu n’est analysé automatiquement."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionButton
            disabled={isPending}
            onClick={() => addEvent("session_started")}
          >
            <Play className="size-4" aria-hidden="true" />
            Commencer la séance
          </ActionButton>
          <ActionButton
            disabled={isPending}
            onClick={() => addEvent("session_ended")}
            secondary
          >
            <Square className="size-4" aria-hidden="true" />
            Noter la fin
          </ActionButton>
        </div>
        <p className="mt-4 text-sm text-[#61716f]">
          {artifacts.events.length === 0
            ? "Aucun repère de séance enregistré."
            : `${artifacts.events.length} repère${artifacts.events.length > 1 ? "s" : ""} temporel${artifacts.events.length > 1 ? "s" : ""} enregistré${artifacts.events.length > 1 ? "s" : ""}.`}
        </p>
      </Panel>

      <Panel
        icon={<Flag className="size-5" aria-hidden="true" />}
        eyebrow="Après"
        title="Décisions et suites"
        description="Note les prochaines étapes telles qu’elles ont été décidées, sans interprétation médicale."
      >
        <form className="space-y-3" onSubmit={submitDecision}>
          <label
            className="block text-sm font-bold text-[#18312f]"
            htmlFor="appointment-decision"
          >
            Une suite à retenir
          </label>
          <textarea
            id="appointment-decision"
            className="min-h-24 w-full resize-y rounded-2xl border border-[#cad8d2] bg-white px-4 py-3 text-base text-[#18312f] outline-none placeholder:text-[#82908e] focus-visible:ring-2 focus-visible:ring-[#166f9e]"
            maxLength={500}
            onChange={(event) => setDecision(event.target.value)}
            placeholder="Par exemple : noter le sommeil jusqu’au prochain rendez-vous"
            value={decision}
          />
          <ActionButton disabled={!decision.trim() || isPending} type="submit">
            Ajouter au débrief
          </ActionButton>
        </form>
        <ul className="mt-5 space-y-2" aria-label="Décisions du rendez-vous">
          {artifacts.decisions.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl bg-[#f8f1ea] p-4 text-sm leading-6 text-[#4f4339]"
            >
              {item.summary}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        icon={<FileText className="size-5" aria-hidden="true" />}
        eyebrow="Partager"
        title="Brief de consultation"
        description="Un instantané explicite et versionné. Les notes privées sont exclues à chaque génération."
      >
        <ActionButton disabled={isPending} onClick={createBrief}>
          Créer un nouveau brief
        </ActionButton>
        {activeBrief ? (
          <div className="mt-4 space-y-4 rounded-2xl bg-[#eef5f2] p-4">
            <p className="font-bold text-[#18312f]">
              Version {activeBrief.version}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#526765]">
              {activeBrief.content.questions.length} question(s) ·{" "}
              {activeBrief.content.decisions.length} suite(s) ·{" "}
              {activeBrief.content.excludedPrivateQuestionCount} note(s)
              privée(s) exclue(s)
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <ActionButton
                disabled={isPending}
                onClick={downloadBrief}
                secondary
              >
                <Download className="size-4" aria-hidden="true" />
                Télécharger le PDF
              </ActionButton>
              <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-[#afc9bc] bg-white px-3 text-sm font-bold text-[#315451]">
                Durée
                <select
                  aria-label="Durée du lien temporaire"
                  className="min-h-9 flex-1 bg-transparent outline-none"
                  onChange={(event) =>
                    setShareDuration(
                      Number(
                        event.target.value,
                      ) as AppointmentBriefShareDurationHours,
                    )
                  }
                  value={shareDuration}
                >
                  <option value={1}>1 heure</option>
                  <option value={24}>24 heures</option>
                  <option value={72}>3 jours</option>
                  <option value={168}>7 jours</option>
                </select>
              </label>
            </div>
            <ActionButton disabled={isPending} onClick={createShare}>
              <Share2 className="size-4" aria-hidden="true" />
              Créer et copier un lien temporaire
            </ActionButton>
            {latestShareUrl ? (
              <div className="flex gap-2">
                <input
                  aria-label="Dernier lien temporaire créé"
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#afc9bc] bg-white px-3 text-sm text-[#294542] outline-none focus-visible:ring-2 focus-visible:ring-[#166f9e]"
                  onFocus={(event) => event.currentTarget.select()}
                  readOnly
                  value={latestShareUrl}
                />
                <button
                  aria-label="Copier le dernier lien temporaire"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#155c5a] outline-none hover:bg-[#e1eee9] focus-visible:ring-2 focus-visible:ring-[#166f9e]"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(latestShareUrl)
                      .then(() => setStatus("Lien copié."))
                      .catch(() =>
                        setStatus("Sélectionne le lien pour le copier."),
                      );
                  }}
                  type="button"
                >
                  <Copy className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            {shares.length > 0 ? (
              <ul className="space-y-2" aria-label="Liens de partage du brief">
                {shares.map((share) => {
                  const active =
                    !share.revokedAt && new Date(share.expiresAt) > new Date();
                  return (
                    <li
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs text-[#526765]"
                      key={share.id}
                    >
                      <span>
                        {active ? "Actif" : "Inactif"} · {share.accessCount}{" "}
                        accès · expire le{" "}
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(share.expiresAt))}
                      </span>
                      {active ? (
                        <button
                          aria-label="Révoquer ce lien"
                          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[#8b3f32] outline-none hover:bg-[#f8e9e3] focus-visible:ring-2 focus-visible:ring-[#166f9e]"
                          disabled={isPending}
                          onClick={() => revokeShare(share.id)}
                          type="button"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <p className="flex gap-2 text-xs leading-5 text-[#526765]">
              <Copy className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Le secret reste après le # du lien : il n’apparaît pas dans les
              journaux du serveur. Tu peux révoquer chaque lien ici.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#61716f]">
            Aucun brief créé. Tu peux continuer à préparer avant d’en générer
            un.
          </p>
        )}
      </Panel>

      <p className="lg:col-span-2" aria-live="polite" role="status">
        {status ? (
          <span className="inline-flex rounded-full bg-[#dcede8] px-4 py-2 text-sm font-bold text-[#155c5a]">
            {status}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function Panel({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#dde4df] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(24,49,47,0.05)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#dcede8] text-[#1e7775]">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#18312f]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#61716f]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  secondary = false,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  secondary?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={
        secondary
          ? "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#afc9bc] bg-[#eef5f2] px-4 text-sm font-bold text-[#155c5a] outline-none hover:bg-[#e1eee9] focus-visible:ring-2 focus-visible:ring-[#166f9e] disabled:cursor-not-allowed disabled:opacity-45"
          : "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1e7775] px-4 text-sm font-bold text-white outline-none hover:bg-[#155c5a] focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
      }
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

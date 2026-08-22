"use client";

import type {
  AppointmentArtifactsDto,
  AppointmentBriefDto,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
  CreateAppointmentArtifactInput,
} from "@moodday/contracts";
import {
  Check,
  FileText,
  Flag,
  LockKeyhole,
  MessageCircleQuestion,
  Play,
  Square,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";

type Artifact =
  | AppointmentQuestionDto
  | AppointmentEventDto
  | AppointmentDecisionDto
  | AppointmentBriefDto;

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

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
  const [status, setStatus] = useState<string>();
  const [isPending, startTransition] = useTransition();

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
        {artifacts.briefs[0] ? (
          <div className="mt-4 rounded-2xl bg-[#eef5f2] p-4">
            <p className="font-bold text-[#18312f]">
              Version {artifacts.briefs[0].version}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#526765]">
              {artifacts.briefs[0].content.questions.length} question(s) ·{" "}
              {artifacts.briefs[0].content.decisions.length} suite(s) ·{" "}
              {artifacts.briefs[0].content.excludedPrivateQuestionCount} note(s)
              privée(s) exclue(s)
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

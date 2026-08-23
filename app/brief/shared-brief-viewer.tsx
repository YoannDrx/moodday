"use client";

import type { SharedAppointmentBriefDto } from "@moodday/contracts";
import { Download, LockKeyhole, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type State =
  | { status: "loading" }
  | { status: "ready"; data: SharedAppointmentBriefDto; token: string }
  | { status: "unavailable" };

const copy = {
  fr: {
    loading: "Ouverture du brief sécurisé…",
    unavailableTitle: "Ce brief n’est plus disponible",
    unavailableBody:
      "Le lien a peut-être expiré ou été révoqué. Demande un nouveau lien à la personne qui l’a partagé.",
    eyebrow: "Mood Day · Brief de consultation",
    privateNotes: (count: number) =>
      `${count} note(s) privée(s) exclue(s). Mood Day ne les ajoute jamais automatiquement.`,
    questions: "Questions préparées",
    noQuestions: "Aucune question incluse.",
    decisions: "Décisions et suites",
    noDecisions: "Aucune suite incluse.",
    validUntil: "Lien valable jusqu’au",
    disclaimer:
      "Ce document ne contient ni diagnostic ni recommandation de soin.",
    preparing: "Préparation…",
    download: "Télécharger le PDF",
    version: "Version",
  },
  en: {
    loading: "Opening the secure brief…",
    unavailableTitle: "This brief is no longer available",
    unavailableBody:
      "The link may have expired or been revoked. Ask the person who shared it for a new link.",
    eyebrow: "Mood Day · Appointment brief",
    privateNotes: (count: number) =>
      `${count} private note(s) excluded. Mood Day never adds them automatically.`,
    questions: "Prepared questions",
    noQuestions: "No question included.",
    decisions: "Decisions and follow-ups",
    noDecisions: "No follow-up included.",
    validUntil: "Link valid until",
    disclaimer:
      "This document does not contain a diagnosis or treatment recommendation.",
    preparing: "Preparing…",
    download: "Download PDF",
    version: "Version",
  },
} as const;

const dateLabel = (value: string, timezone: string, locale: "fr" | "en") =>
  new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));

export function SharedBriefViewer({ locale }: { locale: "fr" | "en" }) {
  const text = copy[locale];
  const [state, setState] = useState<State>({ status: "loading" });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (!token) {
      setState({ status: "unavailable" });
      return;
    }
    const controller = new AbortController();
    void fetch("/api/v2/shared-appointment-brief", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as {
          data: SharedAppointmentBriefDto;
        };
        setState({ status: "ready", data: body.data, token });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setState({ status: "unavailable" });
        }
      });
    return () => controller.abort();
  }, []);

  const downloadPdf = async () => {
    if (state.status !== "ready") return;
    setIsDownloading(true);
    try {
      const response = await fetch("/api/v2/shared-appointment-brief/pdf", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, locale }),
      });
      if (!response.ok) throw new Error("unavailable");
      const href = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `moodday-brief-v${state.data.brief.version}.pdf`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      setState({ status: "unavailable" });
    } finally {
      setIsDownloading(false);
    }
  };

  if (state.status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f5f2eb] px-5">
        <p role="status" className="text-sm font-bold text-[#526765]">
          {text.loading}
        </p>
      </main>
    );
  }

  if (state.status === "unavailable") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f5f2eb] px-5 py-12">
        <section className="w-full max-w-xl rounded-[32px] border border-[#dde4df] bg-[#fffdf8] p-7 text-center shadow-[0_24px_70px_rgba(24,49,47,0.09)] sm:p-10">
          <LockKeyhole
            className="mx-auto size-10 text-[#1e7775]"
            aria-hidden="true"
          />
          <h1 className="mt-5 text-3xl font-bold text-[#18312f]">
            {text.unavailableTitle}
          </h1>
          <p className="mt-3 leading-7 text-[#526765]">
            {text.unavailableBody}
          </p>
        </section>
      </main>
    );
  }

  const { brief, expiresAt } = state.data;
  const { appointment, decisions, excludedPrivateQuestionCount, questions } =
    brief.content;
  return (
    <main className="min-h-dvh bg-[#f5f2eb] px-4 py-8 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-[#dde4df] bg-[#fffdf8] shadow-[0_24px_70px_rgba(24,49,47,0.09)]">
        <header className="grid gap-6 bg-[#e8f2ec] p-6 sm:grid-cols-[1fr_180px] sm:p-9">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
              {text.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-bold text-[#18312f] sm:text-4xl">
              {appointment.title}
            </h1>
            <p className="mt-3 leading-7 text-[#526765]">
              {dateLabel(appointment.startsAt, appointment.timezone, locale)}
              {appointment.clinician ? ` · ${appointment.clinician}` : ""}
            </p>
          </div>
          <Image
            alt=""
            aria-hidden="true"
            className="hidden h-auto w-full self-end sm:block"
            height={180}
            src="/brand/illustrations/consultation-brief.png"
            width={180}
          />
        </header>

        <div className="space-y-7 p-6 sm:p-9">
          <div className="flex gap-3 rounded-2xl bg-[#eef5f2] p-4 text-sm leading-6 text-[#315451]">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <p>
              {text.version} {brief.version}.{" "}
              {text.privateNotes(excludedPrivateQuestionCount)}
            </p>
          </div>

          <BriefSection title={text.questions} empty={text.noQuestions}>
            {questions.map((question, index) => (
              <li key={`${question.content}-${index}`}>{question.content}</li>
            ))}
          </BriefSection>

          <BriefSection title={text.decisions} empty={text.noDecisions}>
            {decisions.map((decision, index) => (
              <li key={`${decision.summary}-${index}`}>{decision.summary}</li>
            ))}
          </BriefSection>

          <div className="flex flex-col gap-4 border-t border-[#dde4df] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#61716f]">
              {text.validUntil}{" "}
              {dateLabel(expiresAt, appointment.timezone, locale)}.{" "}
              {text.disclaimer}
            </p>
            <button
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1e7775] px-5 text-sm font-bold text-white outline-none hover:bg-[#155c5a] focus-visible:ring-2 focus-visible:ring-[#166f9e] focus-visible:ring-offset-2 disabled:opacity-50"
              disabled={isDownloading}
              onClick={() => void downloadPdf()}
              type="button"
            >
              <Download className="size-4" aria-hidden="true" />
              {isDownloading ? text.preparing : text.download}
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}

function BriefSection({
  children,
  empty,
  title,
}: {
  children: ReactNode;
  empty: string;
  title: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <section>
      <h2 className="text-xl font-bold text-[#18312f]">{title}</h2>
      {items.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7 text-[#294542] marker:font-bold marker:text-[#1e7775]">
          {children}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-[#61716f]">{empty}</p>
      )}
    </section>
  );
}

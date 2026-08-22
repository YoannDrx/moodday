"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageLayout } from "@/components/nowts/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveConsultationPreparation } from "@/features/consultation/consultation.action";
import { setConsultationPreparationStatus } from "@/features/consultation/consultation.action";
import { useI18n } from "@/i18n/provider";
import { getDateKeyForTimeZone } from "@/lib/temporal/civil-date";

type Preparation = {
  id: string;
  scheduledFor: Date | null;
  title: string;
  questions: string[];
  importantEvents: string[];
  periodStartDate: string;
  periodEndDate: string;
  personalNotes: string | null;
  status: "draft" | "completed" | "archived";
};

export function ConsultationPreparationEditor({
  preparations,
  todayDate,
  initialStartDate,
  timezone,
  canCreateReport,
  billingEnabled,
}: {
  preparations: Preparation[];
  todayDate: string;
  initialStartDate: string;
  timezone: string;
  canCreateReport: boolean;
  billingEnabled: boolean;
}) {
  const { locale } = useI18n();
  const router = useRouter();
  const fr = locale === "fr";
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState("");
  const [importantEvents, setImportantEvents] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [scheduledFor, setScheduledFor] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const reset = () => {
    setEditingId(undefined);
    setTitle("");
    setQuestions("");
    setImportantEvents("");
    setNotes("");
    setStartDate(initialStartDate);
    setEndDate(todayDate);
    setScheduledFor("");
  };

  const edit = (preparation: Preparation) => {
    setEditingId(preparation.id);
    setTitle(preparation.title);
    setQuestions(preparation.questions.join("\n"));
    setImportantEvents(preparation.importantEvents.join("\n"));
    setNotes(preparation.personalNotes ?? "");
    setStartDate(preparation.periodStartDate);
    setEndDate(preparation.periodEndDate);
    setScheduledFor(
      preparation.scheduledFor
        ? getDateKeyForTimeZone(preparation.scheduledFor, timezone)
        : "",
    );
  };

  const save = async () => {
    setPending(true);
    const result = await saveConsultationPreparation({
      id: editingId,
      title,
      questions: questions
        .split("\n")
        .map((question) => question.trim())
        .filter(Boolean)
        .slice(0, 20),
      importantEvents: importantEvents
        .split("\n")
        .map((event) => event.trim())
        .filter(Boolean)
        .slice(0, 20),
      personalNotes: notes || null,
      periodStartDate: startDate,
      periodEndDate: endDate,
      scheduledFor: scheduledFor || null,
      status: "draft",
    });
    setPending(false);
    if (result.serverError) {
      toast.error(result.serverError);
      return;
    }
    toast.success(fr ? "Préparation enregistrée" : "Preparation saved");
    reset();
    router.refresh();
  };

  const changeStatus = async (
    id: string,
    status: "draft" | "completed" | "archived",
  ) => {
    setPending(true);
    const result = await setConsultationPreparationStatus({ id, status });
    setPending(false);
    if (result.serverError) {
      toast.error(result.serverError);
      return;
    }
    toast.success(fr ? "Statut mis à jour" : "Status updated");
    router.refresh();
  };

  return (
    <PageLayout
      title={fr ? "Préparer une consultation" : "Prepare a consultation"}
      subtitle={
        fr
          ? "Rassemblez vos questions et choisissez les données à relire. Aucun diagnostic ni conseil médical n’est généré."
          : "Gather your questions and choose the data to review. No diagnosis or medical advice is generated."
      }
      maxWidth="4xl"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <fieldset
          aria-busy={!hydrated || pending}
          className="space-y-4 rounded-xl border p-5"
          disabled={!hydrated || pending}
        >
          <legend className="sr-only">
            {fr ? "Préparation du rendez-vous" : "Appointment preparation"}
          </legend>
          <div className="space-y-2">
            <Label htmlFor="consultation-title">{fr ? "Titre" : "Title"}</Label>
            <Input
              id="consultation-title"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-date">
              {fr ? "Date prévue (facultative)" : "Planned date (optional)"}
            </Label>
            <Input
              id="consultation-date"
              type="date"
              value={scheduledFor}
              min={todayDate}
              onChange={(event) => setScheduledFor(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period-start">
                {fr ? "Début des données" : "Data start"}
              </Label>
              <Input
                id="period-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-end">
                {fr ? "Fin des données" : "Data end"}
              </Label>
              <Input
                id="period-end"
                type="date"
                value={endDate}
                max={todayDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-questions">
              {fr
                ? "Mes questions (une par ligne)"
                : "My questions (one per line)"}
            </Label>
            <Textarea
              id="consultation-questions"
              rows={6}
              maxLength={10_000}
              value={questions}
              onChange={(event) => setQuestions(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-events">
              {fr
                ? "Événements importants sélectionnés (un par ligne)"
                : "Selected important events (one per line)"}
            </Label>
            <Textarea
              id="consultation-events"
              rows={5}
              maxLength={10_000}
              value={importantEvents}
              onChange={(event) => setImportantEvents(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-notes">
              {fr ? "Notes personnelles" : "Personal notes"}
            </Label>
            <Textarea
              id="consultation-notes"
              rows={6}
              maxLength={5_000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <Button
            disabled={pending || title.trim().length === 0}
            onClick={() => void save()}
          >
            {pending
              ? fr
                ? "Enregistrement…"
                : "Saving…"
              : fr
                ? editingId
                  ? "Mettre à jour le brouillon"
                  : "Enregistrer le brouillon"
                : editingId
                  ? "Update draft"
                  : "Save draft"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={reset}>
              {fr ? "Annuler la modification" : "Cancel editing"}
            </Button>
          ) : null}
        </fieldset>
        <section aria-labelledby="preparations-title" className="space-y-3">
          <h2 id="preparations-title" className="text-lg font-semibold">
            {fr ? "Préparations récentes" : "Recent preparations"}
          </h2>
          {preparations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {fr ? "Aucun brouillon." : "No draft yet."}
            </p>
          ) : null}
          {preparations.map((preparation) => (
            <article key={preparation.id} className="rounded-xl border p-4">
              <h3 className="font-medium">{preparation.title}</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {preparation.periodStartDate} → {preparation.periodEndDate} ·{" "}
                {preparation.status}
              </p>
              <p className="mt-2 text-sm">
                {preparation.questions.length}{" "}
                {fr ? "question(s)" : "question(s)"}
                {" · "}
                {preparation.importantEvents.length}{" "}
                {fr ? "événement(s)" : "event(s)"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => edit(preparation)}
                >
                  {fr ? "Modifier" : "Edit"}
                </Button>
                {preparation.status !== "completed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      void changeStatus(preparation.id, "completed")
                    }
                  >
                    {fr ? "Marquer terminée" : "Mark completed"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => void changeStatus(preparation.id, "archived")}
                >
                  {fr ? "Archiver" : "Archive"}
                </Button>
                {canCreateReport ? (
                  <Button size="sm" asChild>
                    <a
                      href={`/api/export/pdf?${new URLSearchParams({
                        startDate: preparation.periodStartDate,
                        endDate: preparation.periodEndDate,
                        preparationId: preparation.id,
                      }).toString()}`}
                      download
                    >
                      {fr ? "Télécharger le PDF" : "Download PDF"}
                    </a>
                  </Button>
                ) : billingEnabled ? (
                  <Button size="sm" asChild variant="secondary">
                    <Link href="/pricing">
                      {fr ? "PDF avec Moodday Plus" : "PDF with Moodday Plus"}
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled>
                    {fr
                      ? "PDF indisponible avant l’ouverture de Plus"
                      : "PDF unavailable until Plus opens"}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </PageLayout>
  );
}

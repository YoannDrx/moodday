"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Smile,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  saveMoodTagDefinition,
  searchJournal,
} from "@/features/mood/journal-search.action";
import { useQuickEntryStore } from "@/features/mood/quick-entry-store";
import { useI18n } from "@/i18n/provider";
import {
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { cn } from "@/lib/utils";

type Filters = {
  query: string;
  tags: string;
  moodMin: string;
  moodMax: string;
  start: string;
  end: string;
};

type CustomTag = {
  id: string;
  displayLabel: string;
  category: "context" | "trigger" | "protective";
  color: string | null;
};

const emptyFilters: Filters = {
  query: "",
  tags: "",
  moodMin: "",
  moodMax: "",
  start: "",
  end: "",
};

const getMoodColor = (value: number) => {
  if (value <= 2) return "rgb(239, 68, 68)";
  if (value <= 4) return "rgb(249, 115, 22)";
  if (value <= 6) return "rgb(234, 179, 8)";
  if (value <= 8) return "rgb(132, 204, 22)";
  return "rgb(34, 197, 94)";
};

const getMoodEmoji = (value: number) => {
  if (value <= 1) return "😢";
  if (value <= 3) return "😔";
  if (value <= 5) return "😐";
  if (value <= 7) return "🙂";
  if (value <= 9) return "😊";
  return "😄";
};

export function MoodHistoryList({
  initialCustomTags,
}: {
  initialCustomTags: CustomTag[];
}) {
  const { locale } = useI18n();
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [calendarMode, setCalendarMode] = useState(false);
  const [customTags, setCustomTags] = useState(initialCustomTags);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagCategory, setNewTagCategory] =
    useState<CustomTag["category"]>("context");
  const [savingTag, setSavingTag] = useState(false);
  const { openForEdit } = useQuickEntryStore();

  const query = useQuery({
    queryKey: ["journal-search", filters, page],
    queryFn: async () => {
      const result = await searchJournal({
        query: filters.query,
        tags: filters.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 20),
        moodMin: filters.moodMin ? Number(filters.moodMin) : undefined,
        moodMax: filters.moodMax ? Number(filters.moodMax) : undefined,
        start: filters.start || undefined,
        end: filters.end || undefined,
        page,
        pageSize: 30,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const entries = useMemo(() => query.data?.entries ?? [], [query.data]);
  const timezone = getSafeTimeZone(query.data?.timezone);
  const calendarGroups = useMemo(() => {
    const grouped = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = getDateKeyForTimeZone(
        new Date(entry.createdAt),
        timezone,
      ).slice(0, 7);
      grouped.set(key, [...(grouped.get(key) ?? []), entry]);
    }
    return [...grouped.entries()];
  }, [entries, timezone]);

  const updateDraft = (key: keyof Filters, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const saveCustomTag = async () => {
    const label = newTagLabel.trim();
    if (!label) return;
    setSavingTag(true);
    const result = await saveMoodTagDefinition({
      displayLabel: label,
      category: newTagCategory,
      color: null,
    });
    setSavingTag(false);
    if (result.serverError || !result.data) {
      toast.error(result.serverError ?? "Unable to save tag");
      return;
    }
    const savedTag = result.data;
    setCustomTags((current) => [
      ...current.filter((tag) => tag.id !== savedTag.id),
      savedTag,
    ]);
    setNewTagLabel("");
    toast.success(locale === "fr" ? "Tag enregistré" : "Tag saved");
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <div>
          <h2 className="font-semibold">
            {locale === "fr" ? "Mes tags personnalisés" : "My custom tags"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {locale === "fr"
              ? "Classez vos propres contextes, déclencheurs et facteurs protecteurs."
              : "Organize your own contexts, triggers, and protective factors."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_14rem_auto]">
          <div className="space-y-2">
            <Label htmlFor="custom-tag-label">
              {locale === "fr" ? "Libellé" : "Label"}
            </Label>
            <Input
              id="custom-tag-label"
              maxLength={40}
              value={newTagLabel}
              onChange={(event) => setNewTagLabel(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-tag-category">
              {locale === "fr" ? "Catégorie" : "Category"}
            </Label>
            <select
              id="custom-tag-category"
              value={newTagCategory}
              onChange={(event) =>
                setNewTagCategory(event.target.value as CustomTag["category"])
              }
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="context">
                {locale === "fr" ? "Contexte" : "Context"}
              </option>
              <option value="trigger">
                {locale === "fr" ? "Déclencheur" : "Trigger"}
              </option>
              <option value="protective">
                {locale === "fr" ? "Facteur protecteur" : "Protective factor"}
              </option>
            </select>
          </div>
          <Button
            className="self-end"
            disabled={savingTag || newTagLabel.trim().length === 0}
            onClick={() => void saveCustomTag()}
          >
            {locale === "fr" ? "Ajouter" : "Add"}
          </Button>
        </div>
        {customTags.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Custom tags">
            {customTags.map((tag) => (
              <li
                key={tag.id}
                className="bg-muted rounded-full px-3 py-1 text-sm"
              >
                {tag.displayLabel} · {tag.category}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
      <Card
        className="space-y-4 p-4"
        aria-label={locale === "fr" ? "Filtres du journal" : "Journal filters"}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="journal-query">
              {locale === "fr" ? "Recherche dans les notes" : "Search notes"}
            </Label>
            <Input
              id="journal-query"
              maxLength={100}
              value={draft.query}
              onChange={(event) => updateDraft("query", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="journal-tags">
              {locale === "fr"
                ? "Tags (séparés par des virgules)"
                : "Tags (comma-separated)"}
            </Label>
            <Input
              id="journal-tags"
              maxLength={800}
              value={draft.tags}
              onChange={(event) => updateDraft("tags", event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mood-min">
                {locale === "fr" ? "Humeur min." : "Min mood"}
              </Label>
              <Input
                id="mood-min"
                type="number"
                min={0}
                max={10}
                value={draft.moodMin}
                onChange={(event) => updateDraft("moodMin", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood-max">
                {locale === "fr" ? "Humeur max." : "Max mood"}
              </Label>
              <Input
                id="mood-max"
                type="number"
                min={0}
                max={10}
                value={draft.moodMax}
                onChange={(event) => updateDraft("moodMax", event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="journal-start">
              {locale === "fr" ? "Du" : "From"}
            </Label>
            <Input
              id="journal-start"
              type="date"
              value={draft.start}
              onChange={(event) => updateDraft("start", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="journal-end">{locale === "fr" ? "Au" : "To"}</Label>
            <Input
              id="journal-end"
              type="date"
              value={draft.end}
              onChange={(event) => updateDraft("end", event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setFilters(draft);
              setPage(1);
            }}
          >
            <Search className="size-4" />{" "}
            {locale === "fr" ? "Appliquer" : "Apply"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDraft(emptyFilters);
              setFilters(emptyFilters);
              setPage(1);
            }}
          >
            {locale === "fr" ? "Réinitialiser" : "Reset"}
          </Button>
          <Button
            variant="outline"
            aria-pressed={calendarMode}
            onClick={() => setCalendarMode((current) => !current)}
          >
            <Calendar className="size-4" />{" "}
            {calendarMode
              ? locale === "fr"
                ? "Liste"
                : "List"
              : locale === "fr"
                ? "Calendrier"
                : "Calendar"}
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : null}
      {query.isError ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {locale === "fr" ? "Recherche impossible." : "Search failed."}
          </p>
        </Card>
      ) : null}
      {!query.isLoading && entries.length === 0 ? (
        <Card className="p-8 text-center">
          <Smile className="text-muted-foreground mx-auto mb-4 size-12" />
          <p className="text-muted-foreground">
            {locale === "fr"
              ? "Aucune entrée pour ces filtres."
              : "No entry matches these filters."}
          </p>
        </Card>
      ) : null}

      {calendarMode ? (
        <div className="space-y-8">
          {calendarGroups.map(([month, monthEntries]) => (
            <section key={month} aria-labelledby={`month-${month}`}>
              <h2 id={`month-${month}`} className="mb-3 font-semibold">
                {new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${month}-01T00:00:00.000Z`))}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                {monthEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() =>
                      openForEdit({
                        id: entry.id,
                        value: entry.value,
                        note: entry.note,
                        createdAt: entry.createdAt,
                      })
                    }
                    className="hover:border-primary rounded-lg border p-3 text-left"
                  >
                    <span className="text-muted-foreground block text-xs">
                      {new Intl.DateTimeFormat(
                        locale === "fr" ? "fr-FR" : "en-US",
                        { day: "numeric", month: "short", timeZone: timezone },
                      ).format(new Date(entry.createdAt))}
                    </span>
                    <span
                      className="mt-1 block text-lg font-semibold"
                      style={{ color: getMoodColor(entry.value) }}
                    >
                      {getMoodEmoji(entry.value)} {entry.value}/10
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={cn(
                "cursor-pointer p-4 transition-all hover:shadow-md",
                "hover:border-primary/30",
              )}
              onClick={() =>
                openForEdit({
                  id: entry.id,
                  value: entry.value,
                  note: entry.note,
                  createdAt: entry.createdAt,
                })
              }
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: `${getMoodColor(entry.value)}20` }}
                >
                  {getMoodEmoji(entry.value)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-lg font-bold"
                      style={{ color: getMoodColor(entry.value) }}
                    >
                      {entry.value}/10
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Calendar className="size-3" />
                      {new Intl.DateTimeFormat(
                        locale === "fr" ? "fr-FR" : "en-US",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: timezone,
                        },
                      ).format(new Date(entry.createdAt))}
                    </span>
                  </div>
                  {entry.tags.length > 0 ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {entry.tags.join(" · ")}
                    </p>
                  ) : null}
                  {entry.note ? (
                    <p className="text-muted-foreground mt-1 flex items-start gap-1 truncate text-sm">
                      <MessageSquare className="mt-0.5 size-3 shrink-0" />
                      <span className="truncate">{entry.note}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          disabled={page === 1 || query.isFetching}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <ChevronLeft className="size-4" />
          {locale === "fr" ? "Précédent" : "Previous"}
        </Button>
        <span className="text-muted-foreground text-sm">
          {locale === "fr" ? "Page" : "Page"} {page}
        </span>
        <Button
          variant="outline"
          disabled={entries.length < 30 || query.isFetching}
          onClick={() => setPage((current) => current + 1)}
        >
          {locale === "fr" ? "Suivant" : "Next"}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

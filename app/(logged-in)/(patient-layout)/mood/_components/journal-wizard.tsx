"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Feather,
  Image,
  Info,
  Mic,
  Minus,
  Moon,
  Pill,
  Plus,
  PlusCircle,
  Sparkles,
  Star,
  Tablets,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/nowts/glass-card";
import { cn } from "@/lib/utils";
import {
  symptomLabels,
  eventOptionLabels,
  sleepDisturbanceLabels,
} from "@/lib/design-tokens";
import { saveMoodEntry } from "@/features/mood/mood.action";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import {
  getTodayIntakes,
  logMedIntake,
} from "@/features/medication/medication.action";
import { queueMoodEntry } from "@/features/pwa/offline-queue";
import { getAiJournalInsight } from "@/features/insights/ai-insight.action";
import { useI18n } from "@/i18n/provider";

type JournalEntry = {
  mood: number;
  energy: number;
  anxiety: number;
  sleepHours: number;
  sleepQuality: number;
  sleepDisturbances: string[];
  sideEffects: string;
  symptoms: string[];
  events: string[];
  notes: string;
};

type TodayMedication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  intakes: { id: string; skipped: boolean }[];
};

const initialEntry: JournalEntry = {
  mood: 5,
  energy: 5,
  anxiety: 5,
  sleepHours: 7.5,
  sleepQuality: 3,
  sleepDisturbances: [],
  sideEffects: "",
  symptoms: [],
  events: [],
  notes: "",
};

const symptomOptions = Object.keys(
  symptomLabels,
) as (keyof typeof symptomLabels)[];
const eventOptions = Object.keys(
  eventOptionLabels,
) as (keyof typeof eventOptionLabels)[];
const sleepDisturbanceOptions = Object.keys(
  sleepDisturbanceLabels,
) as (keyof typeof sleepDisturbanceLabels)[];

export function JournalWizard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const maxStep = 5;
  const [entry, setEntry] = useState<JournalEntry>(initialEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"ai" | "heuristic" | null>(null);
  const [insightRequested, setInsightRequested] = useState(false);

  // Get today's date formatted
  const today = new Date().toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const nextStep = () => {
    if (step < maxStep) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSymptom = (symptom: string) => {
    if (entry.symptoms.includes(symptom)) {
      setEntry({
        ...entry,
        symptoms: entry.symptoms.filter((s) => s !== symptom),
      });
    } else {
      setEntry({ ...entry, symptoms: [...entry.symptoms, symptom] });
    }
  };

  const toggleEvent = (event: string) => {
    if (entry.events.includes(event)) {
      setEntry({ ...entry, events: entry.events.filter((e) => e !== event) });
    } else {
      setEntry({ ...entry, events: [...entry.events, event] });
    }
  };

  const toggleSleepDisturbance = (disturbance: string) => {
    if (entry.sleepDisturbances.includes(disturbance)) {
      setEntry({
        ...entry,
        sleepDisturbances: entry.sleepDisturbances.filter(
          (d) => d !== disturbance,
        ),
      });
    } else {
      setEntry({
        ...entry,
        sleepDisturbances: [...entry.sleepDisturbances, disturbance],
      });
    }
  };

  const {
    data: medications = [],
    isLoading: medicationsLoading,
    refetch: refetchMedications,
  } = useQuery<TodayMedication[]>({
    queryKey: ["journal-medications"],
    queryFn: async () => {
      const result = await getTodayIntakes({});
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });

  const logMedicationMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      const result = await logMedIntake({ medicationId });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.intake.logged"));
      void refetchMedications();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleMedicationTaken = (medicationId: string, isTaken: boolean) => {
    if (isTaken || logMedicationMutation.isPending) return;
    logMedicationMutation.mutate(medicationId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Map sleepQuality from 1-5 scale to string
      const sleepQualityMap: Record<number, "bad" | "average" | "good"> = {
        1: "bad",
        2: "bad",
        3: "average",
        4: "good",
        5: "good",
      };

      // Combine symptoms and events as tags
      const tags = [...entry.symptoms, ...entry.events];

      // Parse sideEffects from string to array
      const sideEffectsArray = entry.sideEffects
        ? entry.sideEffects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        value: entry.mood,
        note: entry.notes || undefined,
        energy: entry.energy,
        sleepHours: entry.sleepHours,
        sleepQuality: sleepQualityMap[entry.sleepQuality],
        sleepDisturbances: entry.sleepDisturbances,
        anxiety: entry.anxiety,
        tags,
        sideEffects: sideEffectsArray,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueMoodEntry(payload);
        toast.success(t("mood.entry.offlineSaved"));
        router.push("/dashboard");
        return;
      }

      const result = await saveMoodEntry(payload);

      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success(t("mood.journal.saved"));
      router.push("/dashboard");
    } catch {
      toast.error(t("mood.journal.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const fallbackInsight = t("mood.journal.insight.fallback");

  const { execute: fetchInsight, status: insightStatus } = useAction(
    getAiJournalInsight,
    {
      onSuccess: (result) => {
        setAiInsight(result.data.message);
        setAiSource(result.data.source);
      },
      onError: () => {
        setAiInsight(fallbackInsight);
        setAiSource("heuristic");
      },
    },
  );

  useEffect(() => {
    if (step !== maxStep) {
      setInsightRequested(false);
      return;
    }

    if (insightRequested) return;
    setInsightRequested(true);

    fetchInsight({
      mood: entry.mood,
      energy: entry.energy,
      anxiety: entry.anxiety,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality,
      notes: entry.notes,
      tags: [...entry.symptoms, ...entry.events],
    });
  }, [step, maxStep, insightRequested, fetchInsight, entry]);

  const insightText =
    insightStatus === "executing"
      ? t("mood.journal.insight.loading")
      : (aiInsight ?? fallbackInsight);
  const insightTitle =
    aiSource === "ai"
      ? t("mood.journal.insight.titleAi")
      : t("mood.journal.insight.title");

  const getMoodEmoji = () => {
    if (entry.mood < 4) return "😔";
    if (entry.mood < 7) return "😐";
    return "😊";
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[100px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[100px]" />

      {/* Navigation Header */}
      <nav className="glass-card sticky top-0 z-50 border-b border-gray-100 px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="size-6 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t("mood.journal.title")}
              </h1>
              <p className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                {today}
              </p>
            </div>
          </div>

          {/* Desktop Progress */}
          <div className="hidden items-center gap-2 md:flex">
            {Array.from({ length: maxStep }).map((_, i) => (
              <div
                key={i}
                className="h-2 w-12 overflow-hidden rounded-full bg-gray-200"
              >
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: step >= i + 1 ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-soft rounded-xl bg-[var(--primary)] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-[var(--primary-dark)] active:scale-95"
          >
            {isSaving ? t("common.saving") : t("actions.save")}
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 pt-8 lg:px-6">
        {/* Step 1: Mood & Energy */}
        {step === 1 && (
          <section className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-300">
            <div className="mb-10 text-center">
              <div className="shadow-soft mb-4 inline-block animate-bounce rounded-3xl bg-white p-4">
                <span className="text-5xl">{getMoodEmoji()}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t("mood.journal.step1.title")}
              </h2>
              <p className="mt-2 text-gray-500">
                {t("mood.journal.step1.subtitle")}
              </p>
            </div>

            <GlassCard padding="lg" variant="elevated" className="space-y-12">
              {/* Mood Slider */}
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <label className="text-lg font-bold">
                    {t("mood.journal.step1.moodLabel")}
                  </label>
                  <span className="text-3xl font-black text-[var(--primary)]">
                    {entry.mood}/10
                  </span>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={entry.mood}
                    onChange={(e) =>
                      setEntry({ ...entry, mood: Number(e.target.value) })
                    }
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-[var(--primary)]"
                  />
                  <div className="mt-4 flex justify-between px-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    <span>{t("mood.journal.step1.moodScale.low")}</span>
                    <span>{t("mood.journal.step1.moodScale.mid")}</span>
                    <span>{t("mood.journal.step1.moodScale.high")}</span>
                  </div>
                </div>
              </div>

              {/* Energy Slider */}
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <label className="text-lg font-bold">
                    {t("mood.journal.step1.energyLabel")}
                  </label>
                  <span className="text-3xl font-black text-[var(--sage)]">
                    {entry.energy}/10
                  </span>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={entry.energy}
                    onChange={(e) =>
                      setEntry({ ...entry, energy: Number(e.target.value) })
                    }
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-[var(--sage)]"
                  />
                  <div className="mt-4 flex justify-between px-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    <span>{t("mood.journal.step1.energyScale.low")}</span>
                    <span>{t("mood.journal.step1.energyScale.mid")}</span>
                    <span>{t("mood.journal.step1.energyScale.high")}</span>
                  </div>
                </div>
              </div>

              {/* Anxiety Slider */}
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <label className="text-lg font-bold">
                    {t("mood.journal.step1.anxietyLabel")}
                  </label>
                  <span className="text-3xl font-black text-red-500">
                    {entry.anxiety}/10
                  </span>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={entry.anxiety}
                    onChange={(e) =>
                      setEntry({ ...entry, anxiety: Number(e.target.value) })
                    }
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-red-500"
                  />
                  <div className="mt-4 flex justify-between px-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    <span>{t("mood.journal.step1.anxietyScale.low")}</span>
                    <span>{t("mood.journal.step1.anxietyScale.mid")}</span>
                    <span>{t("mood.journal.step1.anxietyScale.high")}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </section>
        )}

        {/* Step 2: Sleep */}
        {step === 2 && (
          <section className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-300">
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-3xl bg-[var(--lavender)]/30">
                <Moon className="size-8 text-[var(--primary-darkest)]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t("mood.journal.step2.title")}
              </h2>
              <p className="mt-2 text-gray-500">
                {t("mood.journal.step2.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <GlassCard
                padding="lg"
                variant="elevated"
                className="flex flex-col items-center justify-center space-y-4 text-center"
              >
                <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                  {t("mood.journal.step2.durationLabel")}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setEntry({
                        ...entry,
                        sleepHours: Math.max(0, entry.sleepHours - 0.5),
                      })
                    }
                    className="flex size-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                  >
                    <Minus className="size-5" />
                  </button>
                  <div className="text-4xl font-black text-gray-900">
                    {entry.sleepHours}
                    <span className="ml-1 text-lg font-bold text-gray-400">
                      h
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setEntry({
                        ...entry,
                        sleepHours: Math.min(24, entry.sleepHours + 0.5),
                      })
                    }
                    className="flex size-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              </GlassCard>

              <GlassCard padding="lg" variant="elevated" className="space-y-6">
                <label className="block text-center text-xs font-bold tracking-widest text-gray-500 uppercase">
                  {t("mood.journal.step2.qualityLabel")}
                </label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setEntry({ ...entry, sleepQuality: i })}
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl transition-all duration-300",
                        entry.sleepQuality >= i
                          ? "scale-110 bg-[var(--primary)] text-white shadow-lg"
                          : "bg-gray-100 text-gray-400",
                      )}
                    >
                      <Star
                        className="size-6"
                        fill={entry.sleepQuality >= i ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>

            <GlassCard padding="lg" variant="elevated">
              <label className="mb-6 block font-bold">
                {t("mood.journal.step2.disturbancesLabel")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {sleepDisturbanceOptions.map((disturbance) => (
                  <button
                    key={disturbance}
                    onClick={() => toggleSleepDisturbance(disturbance)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-left font-medium transition-all",
                      entry.sleepDisturbances.includes(disturbance)
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-darkest)]"
                        : "border-gray-100 bg-white/50 text-gray-600 hover:border-[var(--primary)]/30 hover:bg-white",
                    )}
                  >
                    <span>{t(sleepDisturbanceLabels[disturbance])}</span>
                    {entry.sleepDisturbances.includes(disturbance) && (
                      <Check className="size-4" />
                    )}
                  </button>
                ))}
              </div>
            </GlassCard>
          </section>
        )}

        {/* Step 3: Medications */}
        {step === 3 && (
          <section className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-300">
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-3xl bg-[var(--sage)]/20">
                <Pill className="size-8 text-[var(--sage-dark)]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t("mood.journal.step3.title")}
              </h2>
              <p className="mt-2 text-gray-500">
                {t("mood.journal.step3.subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              {medicationsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-[32px]" />
                  <Skeleton className="h-20 rounded-[32px]" />
                </div>
              ) : medications.length > 0 ? (
                medications.map((med) => {
                  const isTaken = med.intakes.some((i) => !i.skipped);
                  return (
                    <GlassCard
                      key={med.id}
                      padding="md"
                      variant="elevated"
                      className={cn(
                        "flex items-center justify-between transition-all",
                        isTaken && "border-[var(--sage)]/30 bg-[var(--sage)]/5",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex size-12 items-center justify-center rounded-2xl transition-colors",
                            isTaken
                              ? "bg-[var(--sage)] text-white"
                              : "bg-gray-100 text-gray-400",
                          )}
                        >
                          <Tablets className="size-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {med.name}
                          </h4>
                          <p className="text-sm text-gray-500">{med.dosage}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMedicationTaken(med.id, isTaken)}
                        disabled={isTaken || logMedicationMutation.isPending}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-6 py-2 font-bold transition-all",
                          isTaken
                            ? "bg-[var(--sage)] text-white"
                            : "border-2 border-gray-100 bg-white text-gray-300 hover:border-[var(--sage)]/40 hover:text-[var(--sage)]",
                        )}
                      >
                        <span>
                          {isTaken
                            ? t("medication.status.taken")
                            : t("mood.journal.step3.markTaken")}
                        </span>
                        <CheckCircle2 className="size-5" />
                      </button>
                    </GlassCard>
                  );
                })
              ) : (
                <GlassCard padding="md" variant="elevated">
                  <p className="text-center text-sm text-gray-500">
                    {t("mood.journal.step3.noMeds")}
                  </p>
                </GlassCard>
              )}

              <Link
                href="/medications/today"
                className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-gray-200 py-4 font-medium text-gray-400 transition-all hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
              >
                <PlusCircle className="size-5" />
                {t("mood.journal.step3.addOneOff")}
              </Link>
            </div>

            {/* Side Effects */}
            <GlassCard padding="lg" variant="elevated" className="mt-8">
              <h4 className="mb-4 flex items-center gap-2 font-bold">
                <Info className="size-5 text-[var(--primary)]" />
                {t("mood.journal.step3.sideEffectsTitle")}
              </h4>
              <textarea
                value={entry.sideEffects}
                onChange={(e) =>
                  setEntry({ ...entry, sideEffects: e.target.value })
                }
                placeholder={t("mood.journal.step3.sideEffectsPlaceholder")}
                className="min-h-[100px] w-full rounded-2xl border border-gray-100 bg-white/50 p-4 transition-all outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </GlassCard>
          </section>
        )}

        {/* Step 4: Symptoms & Events */}
        {step === 4 && (
          <section className="animate-in fade-in slide-in-from-right-4 space-y-12 duration-300">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                {t("mood.journal.step4.title")}
              </h2>
              <p className="mt-2 text-gray-500">
                {t("mood.journal.step4.subtitle")}
              </p>
            </div>

            {/* Symptoms Tags */}
            <div className="space-y-4">
              <label className="block px-2 text-sm font-bold tracking-widest text-gray-400 uppercase">
                {t("mood.journal.step4.symptomsLabel")}
              </label>
              <div className="flex flex-wrap gap-3">
                {symptomOptions.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={cn(
                      "rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300",
                      entry.symptoms.includes(symptom)
                        ? "scale-105 border-[var(--primary)] bg-[var(--primary)] text-white shadow-lg"
                        : "border-gray-100 bg-white text-gray-600",
                    )}
                  >
                    {t(symptomLabels[symptom])}
                  </button>
                ))}
                <button className="rounded-2xl border-2 border-dashed border-gray-200 px-5 py-3 text-gray-400 transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Events Tags */}
            <div className="space-y-4">
              <label className="block px-2 text-sm font-bold tracking-widest text-gray-400 uppercase">
                {t("mood.journal.step4.eventsLabel")}
              </label>
              <div className="flex flex-wrap gap-3">
                {eventOptions.map((event) => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className={cn(
                      "rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300",
                      entry.events.includes(event)
                        ? "scale-105 border-[var(--sage)] bg-[var(--sage)] text-white shadow-lg"
                        : "border-gray-100 bg-white text-gray-600",
                    )}
                  >
                    {t(eventOptionLabels[event])}
                  </button>
                ))}
                <button className="rounded-2xl border-2 border-dashed border-gray-200 px-5 py-3 text-gray-400 transition-all hover:border-[var(--sage)] hover:text-[var(--sage)]">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 5: Notes & Summary */}
        {step === 5 && (
          <section className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-300">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-3xl bg-[var(--primary)]/10">
                <Feather className="size-8 text-[var(--primary)]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t("mood.journal.step5.title")}
              </h2>
              <p className="mt-2 text-gray-500">
                {t("mood.journal.step5.subtitle")}
              </p>
            </div>

            <GlassCard
              padding="none"
              variant="elevated"
              className="rounded-3xl"
            >
              <textarea
                value={entry.notes}
                onChange={(e) =>
                  setEntry({
                    ...entry,
                    notes: e.target.value.slice(0, 500),
                  })
                }
                placeholder={t("mood.journal.step5.placeholder")}
                className="h-64 w-full resize-none border-none bg-transparent p-6 text-lg text-gray-700 outline-none placeholder:text-gray-300 focus:ring-0"
                maxLength={500}
              />
              <div className="flex items-center justify-between rounded-b-3xl border-t border-gray-50 bg-gray-50/30 p-4">
                <div className="flex gap-2">
                  <button className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white">
                    <Image className="size-5" />
                  </button>
                  <button className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white">
                    <Mic className="size-5" />
                  </button>
                </div>
                <span className="text-xs font-bold text-gray-400">
                  {entry.notes.length}/500
                </span>
              </div>
            </GlassCard>

            {/* AI Insight */}
            <div className="flex gap-4 rounded-3xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Sparkles className="size-5 text-[var(--primary)]" />
              </div>
              <div>
                <h5 className="mb-1 text-sm font-bold text-[var(--primary-darkest)]">
                  {insightTitle}
                </h5>
                <p className="text-sm leading-relaxed text-gray-600">
                  {insightText}
                </p>
                {aiSource === "heuristic" && (
                  <span className="mt-2 block text-xs font-medium text-gray-400">
                    {t("mood.journal.insight.localNotice")}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Fixed Bottom Controls */}
      <div className="glass-card fixed bottom-0 left-0 z-50 w-full border-t border-gray-100 p-4 lg:p-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 py-4 font-bold text-gray-500 transition-all md:border-none",
              step === 1 ? "opacity-30" : "hover:bg-gray-100",
            )}
          >
            <ChevronLeft className="size-5" />
            <span className="hidden sm:inline">{t("actions.previous")}</span>
          </button>

          {/* Mobile Progress */}
          <div className="flex flex-[2] items-center justify-center gap-2 md:hidden">
            {Array.from({ length: maxStep }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  step === i + 1
                    ? "h-1.5 w-8 bg-[var(--primary)]"
                    : "size-2 bg-gray-200",
                )}
              />
            ))}
          </div>

          <button
            onClick={step === maxStep ? handleSave : nextStep}
            disabled={isSaving}
            className="shadow-soft flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] py-4 font-bold text-white transition-all hover:bg-[var(--primary-dark)] active:scale-95"
          >
            <span>
              {step === maxStep
                ? t("actions.finish")
                : t("actions.continue")}
            </span>
            {step === maxStep ? (
              <Check className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

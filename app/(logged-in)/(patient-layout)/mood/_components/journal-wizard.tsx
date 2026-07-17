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
  Info,
  Minus,
  Moon,
  Pill,
  Plus,
  PlusCircle,
  Sparkles,
  Star,
  Tablets,
  Zap,
  Heart,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
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
import { getOfflineStorageErrorMessage } from "@/features/pwa/offline-store";
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

// Step configuration
const steps = [
  { id: 1, icon: Heart, color: "var(--primary)" },
  { id: 2, icon: Moon, color: "var(--lavender)" },
  { id: 3, icon: Pill, color: "var(--sage)" },
  { id: 4, icon: Zap, color: "var(--primary)" },
  { id: 5, icon: Feather, color: "var(--sage)" },
];

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
      const sleepQualityMap: Record<number, "bad" | "average" | "good"> = {
        1: "bad",
        2: "bad",
        3: "average",
        4: "good",
        5: "good",
      };

      const tags = [...entry.symptoms, ...entry.events];
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
        await queueMoodEntry(payload);
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
    } catch (error) {
      toast.error(
        getOfflineStorageErrorMessage(error, {
          quota: t("common.offlineStorageFull"),
          fallback: t("mood.journal.saveError"),
        }),
      );
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

  const currentStepConfig = steps[step - 1];
  const StepIcon = currentStepConfig.icon;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header minimaliste */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="size-5" />
            <span className="text-sm font-medium">{t("actions.back")}</span>
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="size-4" />
            <span className="font-medium capitalize">{today}</span>
          </div>
        </div>
      </header>

      {/* Main content - centré */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <div key={s.id} className="flex items-center">
                  {/* Step circle */}
                  <button
                    onClick={() => setStep(s.id)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "scale-110 border-[var(--primary)] bg-[var(--primary)] text-white shadow-lg"
                        : isCompleted
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-gray-200 bg-white text-gray-400",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </button>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 w-6 rounded-full transition-all duration-300",
                        step > s.id ? "bg-[var(--primary)]" : "bg-gray-200",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Card */}
          <div className="overflow-hidden rounded-3xl border-2 border-[var(--primary)]/20 bg-white shadow-xl">
            {/* Card Header avec icône et titre */}
            <div
              className="border-b border-gray-100 px-8 py-6"
              style={{
                background: `linear-gradient(135deg, ${currentStepConfig.color}08, ${currentStepConfig.color}03)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${currentStepConfig.color}15` }}
                >
                  <StepIcon
                    className="size-7"
                    style={{ color: currentStepConfig.color }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                    {t("mood.journal.stepLabel", {
                      current: step,
                      total: maxStep,
                    })}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">
                    {step === 1 && t("mood.journal.step1.title")}
                    {step === 2 && t("mood.journal.step2.title")}
                    {step === 3 && t("mood.journal.step3.title")}
                    {step === 4 && t("mood.journal.step4.title")}
                    {step === 5 && t("mood.journal.step5.title")}
                  </h2>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              {/* Step 1: Mood & Energy */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 space-y-10 duration-300">
                  {/* Emoji indicator */}
                  <div className="flex justify-center">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <span className="text-5xl">{getMoodEmoji()}</span>
                    </div>
                  </div>

                  {/* Mood Slider */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <label className="font-bold text-gray-700">
                        {t("mood.journal.step1.moodLabel")}
                      </label>
                      <span className="text-2xl font-black text-[var(--primary)]">
                        {entry.mood}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={entry.mood}
                      onChange={(e) =>
                        setEntry({ ...entry, mood: Number(e.target.value) })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-[var(--primary)]"
                    />
                    <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      <span>{t("mood.journal.step1.moodScale.low")}</span>
                      <span>{t("mood.journal.step1.moodScale.high")}</span>
                    </div>
                  </div>

                  {/* Energy Slider */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <label className="font-bold text-gray-700">
                        {t("mood.journal.step1.energyLabel")}
                      </label>
                      <span className="text-2xl font-black text-[var(--sage)]">
                        {entry.energy}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={entry.energy}
                      onChange={(e) =>
                        setEntry({ ...entry, energy: Number(e.target.value) })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-[var(--sage)]"
                    />
                  </div>

                  {/* Anxiety Slider */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <label className="font-bold text-gray-700">
                        {t("mood.journal.step1.anxietyLabel")}
                      </label>
                      <span className="text-2xl font-black text-red-500">
                        {entry.anxiety}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={entry.anxiety}
                      onChange={(e) =>
                        setEntry({ ...entry, anxiety: Number(e.target.value) })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Sleep */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-300">
                  {/* Sleep duration */}
                  <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-6">
                    <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                      {t("mood.journal.step2.durationLabel")}
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          setEntry({
                            ...entry,
                            sleepHours: Math.max(0, entry.sleepHours - 0.5),
                          })
                        }
                        className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm transition-all hover:shadow-md active:scale-95"
                      >
                        <Minus className="size-5 text-gray-600" />
                      </button>
                      <div className="text-5xl font-black text-gray-900">
                        {entry.sleepHours}
                        <span className="ml-1 text-xl font-bold text-gray-400">
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
                        className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm transition-all hover:shadow-md active:scale-95"
                      >
                        <Plus className="size-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Sleep quality */}
                  <div className="space-y-4">
                    <label className="block text-center text-xs font-bold tracking-widest text-gray-500 uppercase">
                      {t("mood.journal.step2.qualityLabel")}
                    </label>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setEntry({ ...entry, sleepQuality: i })
                          }
                          className={cn(
                            "flex size-12 items-center justify-center rounded-xl transition-all duration-200",
                            entry.sleepQuality >= i
                              ? "scale-110 bg-[var(--primary)] text-white shadow-lg"
                              : "bg-gray-100 text-gray-300 hover:bg-gray-200",
                          )}
                        >
                          <Star
                            className="size-6"
                            fill={
                              entry.sleepQuality >= i ? "currentColor" : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep disturbances */}
                  <div className="space-y-4">
                    <label className="block font-bold text-gray-700">
                      {t("mood.journal.step2.disturbancesLabel")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sleepDisturbanceOptions.map((disturbance) => (
                        <button
                          key={disturbance}
                          onClick={() => toggleSleepDisturbance(disturbance)}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                            entry.sleepDisturbances.includes(disturbance)
                              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-darkest)]"
                              : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200",
                          )}
                        >
                          <span>{t(sleepDisturbanceLabels[disturbance])}</span>
                          {entry.sleepDisturbances.includes(disturbance) && (
                            <Check className="size-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Medications */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                  {medicationsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 rounded-xl" />
                      <Skeleton className="h-16 rounded-xl" />
                    </div>
                  ) : medications.length > 0 ? (
                    <div className="space-y-3">
                      {medications.map((med) => {
                        const isTaken = med.intakes.some((i) => !i.skipped);
                        return (
                          <div
                            key={med.id}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-4 transition-all",
                              isTaken
                                ? "border-[var(--sage)]/30 bg-[var(--sage)]/5"
                                : "border-gray-100 bg-gray-50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex size-10 items-center justify-center rounded-xl transition-colors",
                                  isTaken
                                    ? "bg-[var(--sage)] text-white"
                                    : "bg-white text-gray-400",
                                )}
                              >
                                <Tablets className="size-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {med.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {med.dosage}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleMedicationTaken(med.id, isTaken)
                              }
                              disabled={
                                isTaken || logMedicationMutation.isPending
                              }
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
                                isTaken
                                  ? "bg-[var(--sage)] text-white"
                                  : "border border-gray-200 bg-white text-gray-400 hover:border-[var(--sage)] hover:text-[var(--sage)]",
                              )}
                            >
                              <CheckCircle2 className="size-4" />
                              {isTaken
                                ? t("medication.status.taken")
                                : t("mood.journal.step3.markTaken")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        {t("mood.journal.step3.noMeds")}
                      </p>
                    </div>
                  )}

                  <Link
                    href="/medications/today"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-400 transition-all hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
                  >
                    <PlusCircle className="size-4" />
                    {t("mood.journal.step3.addOneOff")}
                  </Link>

                  {/* Side Effects */}
                  <div className="space-y-3 border-t border-gray-100 pt-6">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Info className="size-4 text-[var(--primary)]" />
                      {t("mood.journal.step3.sideEffectsTitle")}
                    </h4>
                    <textarea
                      value={entry.sideEffects}
                      onChange={(e) =>
                        setEntry({ ...entry, sideEffects: e.target.value })
                      }
                      placeholder={t(
                        "mood.journal.step3.sideEffectsPlaceholder",
                      )}
                      className="min-h-[80px] w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm transition-all outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Symptoms & Events */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 space-y-8 duration-300">
                  {/* Symptoms */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase">
                      {t("mood.journal.step4.symptomsLabel")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {symptomOptions.map((symptom) => (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            entry.symptoms.includes(symptom)
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                          )}
                        >
                          {t(symptomLabels[symptom])}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase">
                      {t("mood.journal.step4.eventsLabel")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {eventOptions.map((event) => (
                        <button
                          key={event}
                          onClick={() => toggleEvent(event)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            entry.events.includes(event)
                              ? "border-[var(--sage)] bg-[var(--sage)] text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                          )}
                        >
                          {t(eventOptionLabels[event])}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Notes & Summary */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <textarea
                      value={entry.notes}
                      onChange={(e) =>
                        setEntry({
                          ...entry,
                          notes: e.target.value.slice(0, 500),
                        })
                      }
                      placeholder={t("mood.journal.step5.placeholder")}
                      className="h-40 w-full resize-none border-none bg-gray-50 p-4 text-gray-700 outline-none placeholder:text-gray-400"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-end border-t border-gray-100 bg-white px-4 py-2">
                      <span className="text-xs font-medium text-gray-400">
                        {entry.notes.length}/500
                      </span>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="flex gap-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Sparkles className="size-4 text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="mb-1 text-sm font-bold text-gray-800">
                        {insightTitle}
                      </h5>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {insightText}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer - Navigation */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-8 py-5">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all",
                  step === 1
                    ? "cursor-not-allowed text-gray-300"
                    : "text-gray-600 hover:bg-white hover:shadow-sm",
                )}
              >
                <ChevronLeft className="size-5" />
                {t("actions.previous")}
              </button>

              <button
                onClick={step === maxStep ? handleSave : nextStep}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-[var(--primary-dark)] hover:shadow-xl active:scale-[0.98]"
              >
                {step === maxStep ? (
                  <>
                    {isSaving ? t("common.saving") : t("actions.finish")}
                    <Check className="size-5" />
                  </>
                ) : (
                  <>
                    {t("actions.continue")}
                    <ChevronRight className="size-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

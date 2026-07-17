"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronRight,
  Circle,
  CircleSlash,
  Dumbbell,
  History,
  Heart,
  Moon,
  MessageSquare,
  Pill,
  Plus,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { MoodSlider } from "@/components/nowts/mood-slider";
import { StreakCard } from "@/components/nowts/streak-card";
import { MoodChart } from "@/components/nowts/mood-chart";
import { PageLayout } from "@/components/nowts/page-layout";
import {
  deleteMoodEntry,
  saveMoodEntry,
} from "@/features/mood/mood.action";
import {
  getDashboardSummary,
  getMoodChartData,
  getPatternInsights,
  getStreakData,
} from "@/features/insights/insights.action";
import {
  getTodayIntakes,
  logMedIntake,
  skipMedIntake,
} from "@/features/medication/medication.action";
import { getMyCaregivers } from "@/features/caregiver/caregiver.action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/i18n/provider";
import { useOfflineStatus } from "@/hooks/use-offline-status";
import { queueAction } from "@/features/pwa/offline-actions";
import {
  discardQueuedMoodEntry,
  queueMoodEntry,
} from "@/features/pwa/offline-queue";
import { getOfflineStorageErrorMessage } from "@/features/pwa/offline-store";
import type { DoseSlotStatus } from "@/features/medication/schedule";

type DashboardContentProps = {
  userName: string;
};

type DashboardDoseSlot = {
  id: string;
  doseIndex: number;
  scheduledForDate: string;
  scheduledTime: string | null;
  labelKey: string;
  status: DoseSlotStatus;
};

export function DashboardContent({ userName }: DashboardContentProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [currentMood, setCurrentMood] = useState(7);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [hasQueuedMood, setHasQueuedMood] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isOnline, queuedCount } = useOfflineStatus();
  const showSaveError = (error: unknown) =>
    toast.error(
      getOfflineStorageErrorMessage(error, {
        quota: t("common.offlineStorageFull"),
        fallback: t("common.error"),
      }),
    );

  // Fetch dashboard data
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const result = await getDashboardSummary();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["mood-chart", 7],
    queryFn: async () => {
      const result = await getMoodChartData({ days: 7 });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: insights } = useQuery({
    queryKey: ["pattern-insights"],
    queryFn: async () => {
      const result = await getPatternInsights();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  // Fetch streak data
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["streak-data"],
    queryFn: async () => {
      const result = await getStreakData();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  // Fetch today's medications
  const {
    data: medications,
    isLoading: medicationsLoading,
    refetch: refetchMedications,
  } = useQuery({
    queryKey: ["today-intakes"],
    queryFn: async () => {
      const result = await getTodayIntakes({});
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });

  const { data: caregivers, isLoading: caregiversLoading } = useQuery({
    queryKey: ["dashboard-caregivers"],
    queryFn: async () => {
      const result = await getMyCaregivers();
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });

  // Handle medication intake toggle
  const handleMedIntake = async ({
    medicationId,
    doseIndex,
    scheduledForDate,
    isTaken,
  }: {
    medicationId: string;
    doseIndex: number;
    scheduledForDate: string;
    isTaken: boolean;
  }) => {
    try {
      if (isTaken) {
        return;
      }

      const takenAt = new Date().toISOString();
      if (!isOnline) {
        await queueAction({
          type: "med_intake",
          medicationId,
          doseIndex,
          scheduledForDate,
          takenAt,
        });
        toast.success(t("medication.intake.loggedOffline"));
        return;
      }

      const result = await logMedIntake({
        medicationId,
        doseIndex,
        scheduledForDate,
        takenAt,
      });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("medication.intake.logged"));
      void refetchMedications();
    } catch (error) {
      showSaveError(error);
    }
  };

  // Handle skip medication
  const handleSkipMed = async ({
    medicationId,
    doseIndex,
    scheduledForDate,
  }: {
    medicationId: string;
    doseIndex: number;
    scheduledForDate: string;
  }) => {
    try {
      const takenAt = new Date().toISOString();
      if (!isOnline) {
        await queueAction({
          type: "med_skip",
          medicationId,
          doseIndex,
          scheduledForDate,
          takenAt,
        });
        toast.success(t("medication.intake.skippedOffline"));
        return;
      }

      const result = await skipMedIntake({
        medicationId,
        doseIndex,
        scheduledForDate,
        takenAt,
      });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("medication.intake.skipped"));
      void refetchMedications();
    } catch (error) {
      showSaveError(error);
    }
  };

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

  // Handle mood save
  const handleSaveMood = async () => {
    setIsSaving(true);
    try {
      if (!isOnline) {
        const queuedEntry = await queueMoodEntry({
          value: currentMood,
          energy: currentEnergy,
        });
        setHasQueuedMood(true);
        toast.success(t("mood.entry.offlineSaved"), {
          duration: 8_000,
          action: {
            label: t("mood.entry.undo"),
            onClick: () => {
              void discardQueuedMoodEntry(queuedEntry.id)
                .then(() => {
                  setHasQueuedMood(false);
                  toast.success(t("mood.entry.undone"));
                })
                .catch(showSaveError);
            },
          },
        });
        return;
      }

      const result = await saveMoodEntry({
        value: currentMood,
        energy: currentEnergy,
      });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      setHasQueuedMood(true);
      const savedEntryId = result.data?.id;
      toast.success(t("mood.entry.saved"), {
        duration: 8_000,
        action: savedEntryId
          ? {
              label: t("mood.entry.undo"),
              onClick: () => {
                void deleteMoodEntry({ id: savedEntryId })
                  .then(async (undoResult) => {
                    if (undoResult.serverError) {
                      throw new Error(undoResult.serverError);
                    }
                    setHasQueuedMood(false);
                    toast.success(t("mood.entry.undone"));
                    await Promise.all([
                      queryClient.invalidateQueries({
                        queryKey: ["dashboard-summary"],
                      }),
                      queryClient.invalidateQueries({
                        queryKey: ["mood-chart"],
                      }),
                      queryClient.invalidateQueries({
                        queryKey: ["streak-data"],
                      }),
                      queryClient.invalidateQueries({
                        queryKey: ["pattern-insights"],
                      }),
                    ]);
                  })
                  .catch(showSaveError);
              },
            }
          : undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["mood-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["streak-data"] }),
        queryClient.invalidateQueries({ queryKey: ["pattern-insights"] }),
      ]);
    } catch (error) {
      showSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const medicationDoseSlots =
    medications?.flatMap((medication) =>
      (medication.doseSlots as DashboardDoseSlot[]).map((slot) => ({
        medication,
        slot,
      })),
    ) ?? [];
  const takenCount = medicationDoseSlots.filter(
    ({ slot }) => slot.status === "taken",
  ).length;
  const totalDoseCount = medicationDoseSlots.length;
  const pendingMedicationCount = medicationDoseSlots.filter(
    ({ slot }) => slot.status === "pending",
  ).length;
  const hasMoodToday = hasQueuedMood || (streakData?.hasEntryToday ?? false);

  return (
    <PageLayout
      title={t("dashboard.greeting", { name: userName.split(" ")[0] })}
      subtitle={t("dashboard.today", { date: today })}
      headerRight={
        <Link
          href="/settings/notifications"
          aria-label={t("settings.sidebar.notifications")}
          className="glass-card flex size-12 items-center justify-center rounded-2xl text-gray-600 transition-all hover:text-[var(--primary)]"
        >
          <Bell className="size-6" />
        </Link>
      }
    >
      {(!isOnline || queuedCount > 0) && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <WifiOff className="size-5 shrink-0" />
          <span>
            {!isOnline
              ? t("common.offlineMode")
              : t("common.pendingSync", { count: queuedCount })}
            {!isOnline && queuedCount > 0
              ? ` ${t("common.pendingSync", { count: queuedCount })}`
              : null}
          </span>
        </div>
      )}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/mood"
          className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Heart className="size-5" />
          </div>
          <p className="text-sm font-bold text-gray-800">
            {t("patient.nav.mood")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {hasMoodToday
              ? t("dashboard.todayFocus.moodDone")
              : t("dashboard.todayFocus.moodOpen")}
          </p>
        </Link>

        <Link
          href="/medications/today"
          className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--sage)]/10 text-[var(--sage)]">
            <Pill className="size-5" />
          </div>
          <p className="text-sm font-bold text-gray-800">
            {t("patient.nav.medications")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {pendingMedicationCount === 0
              ? t("dashboard.todayFocus.medsDone")
              : t("dashboard.todayFocus.medsRemaining", {
                  count: pendingMedicationCount,
                })}
          </p>
        </Link>

        <Link
          href="/exercises"
          className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)]">
            <Dumbbell className="size-5" />
          </div>
          <p className="text-sm font-bold text-gray-800">
            {t("patient.nav.exercises")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("dashboard.todayFocus.exercisesCount", {
              count: summary?.exercises.completionsThisWeek ?? 0,
            })}
          </p>
        </Link>

        <Link
          href="/therapy"
          className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <MessageSquare className="size-5" />
          </div>
          <p className="text-sm font-bold text-gray-800">
            {t("patient.nav.therapy")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("dashboard.todayFocus.therapyCount", {
              count: summary?.therapy.sessionsThisMonth ?? 0,
            })}
          </p>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Core Tracking */}
        <div className="space-y-8 lg:col-span-8">
          {/* Quick Mood Section */}
          <GlassCard
            padding="lg"
            variant="elevated"
            className="group relative overflow-hidden"
          >
            <div className="relative z-10">
              <GlassCardHeader>
                <div>
                  <h2 className="mb-1 text-xl font-bold">
                    {t("dashboard.quickMood.title")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("dashboard.quickMood.subtitle")}
                  </p>
                </div>
                <GlassCardBadge>
                  {t("dashboard.quickMood.badge")}
                </GlassCardBadge>
              </GlassCardHeader>

              <div className="my-8">
                <MoodSlider value={currentMood} onChange={setCurrentMood} />

                <div className="mt-8 rounded-2xl border border-gray-100 bg-white/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <label
                      htmlFor="quick-check-in-energy"
                      className="text-sm font-semibold text-gray-700"
                    >
                      {t("dashboard.quickMood.energyLabel")}
                    </label>
                    <output
                      htmlFor="quick-check-in-energy"
                      className="min-w-12 rounded-full bg-[var(--sage)]/10 px-3 py-1 text-center text-sm font-bold text-[var(--sage)] tabular-nums"
                    >
                      {t("dashboard.quickMood.energyValue", {
                        value: currentEnergy,
                      })}
                    </output>
                  </div>
                  <input
                    id="quick-check-in-energy"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={currentEnergy}
                    onChange={(event) =>
                      setCurrentEnergy(Number(event.currentTarget.value))
                    }
                    className="h-11 w-full cursor-pointer accent-[var(--sage)]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveMood}
                  disabled={isSaving}
                  className="shadow-soft flex-grow rounded-2xl bg-[var(--primary)] py-6 text-lg font-bold text-white transition-all hover:bg-[var(--primary-dark)] active:scale-[0.98]"
                >
                  {isSaving
                    ? t("common.saving")
                    : t("dashboard.quickMood.save")}
                </Button>
                <Link
                  href="/mood"
                  aria-label={t("dashboard.quickMood.addDetails")}
                  className="glass-card flex items-center justify-center rounded-2xl px-6 font-bold text-[var(--primary)] transition-all hover:bg-white"
                >
                  <Plus className="size-6" />
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Grid: Meds & Sleep */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Medication Card */}
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Pill className="size-5 text-[var(--primary)]" />}
                >
                  {t("dashboard.medications.title")}
                </GlassCardTitle>
                <GlassCardBadge>
                  {takenCount}/{totalDoseCount}
                </GlassCardBadge>
              </GlassCardHeader>

              <GlassCardContent className="space-y-3">
                {medicationsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                ) : medicationDoseSlots.length > 0 ? (
                  medicationDoseSlots
                    .slice(0, 3)
                    .map(({ medication, slot }) => {
                      const isTaken = slot.status === "taken";
                      const isSkipped = slot.status === "skipped";
                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all",
                            isTaken
                              ? "border-[var(--sage)]/20 bg-[var(--sage)]/10"
                              : isSkipped
                                ? "border-orange-200 bg-orange-50"
                                : "border-gray-100 bg-white hover:border-[var(--primary)]/30",
                          )}
                          onClick={() =>
                            void handleMedIntake({
                              medicationId: medication.id,
                              doseIndex: slot.doseIndex,
                              scheduledForDate: slot.scheduledForDate,
                              isTaken: isTaken || isSkipped,
                            })
                          }
                        >
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-xl transition-all",
                              isTaken
                                ? "bg-[var(--sage)] text-white"
                                : isSkipped
                                  ? "bg-orange-400 text-white"
                                  : "bg-gray-50 text-gray-300 group-hover:text-[var(--primary)]",
                            )}
                          >
                            {isTaken ? (
                              <Check className="size-6" />
                            ) : isSkipped ? (
                              <CircleSlash className="size-6" />
                            ) : (
                              <Circle className="size-6" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <p
                              className={cn(
                                "text-sm font-bold",
                                isTaken
                                  ? "text-[var(--sage-dark)]"
                                  : "text-gray-700",
                              )}
                            >
                              {medication.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {medication.dosage} • {t(slot.labelKey)}
                              {slot.scheduledTime
                                ? ` ${slot.scheduledTime}`
                                : ""}{" "}
                              •{" "}
                              {medication.frequency === "daily"
                                ? t("medication.frequencyShort.daily")
                                : medication.frequency === "twice_daily"
                                  ? t("medication.frequencyShort.twiceDaily")
                                  : medication.frequency === "weekly"
                                    ? t("medication.frequencyShort.weekly")
                                    : medication.frequency === "prn"
                                      ? t("medication.frequencyShort.prn")
                                      : medication.frequency}
                            </p>
                          </div>
                          {!isTaken && !isSkipped && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleSkipMed({
                                  medicationId: medication.id,
                                  doseIndex: slot.doseIndex,
                                  scheduledForDate: slot.scheduledForDate,
                                });
                              }}
                              className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                              {t("medication.intake.skipDose")}
                            </button>
                          )}
                          <ChevronRight className="size-4 text-gray-300" />
                        </div>
                      );
                    })
                ) : (
                  <div className="py-4 text-center text-sm text-gray-400">
                    {t("dashboard.medications.empty")}{" "}
                    <Link
                      href="/medications/new"
                      className="text-[var(--primary)] hover:underline"
                    >
                      {t("medication.list.addNew")}
                    </Link>
                  </div>
                )}
              </GlassCardContent>

              <Link
                href="/medications/today"
                className="mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-500 transition-colors hover:text-[var(--primary)]"
              >
                <History className="size-4" />{" "}
                {t("dashboard.medications.history")}
              </Link>
            </GlassCard>

            {/* Sleep & Energy Card */}
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Moon className="size-5 text-[var(--lavender-dark)]" />}
                >
                  {t("dashboard.sleep.title")}
                </GlassCardTitle>
                {summary?.sleep.avgHours && (
                  <span className="rounded-lg bg-[var(--lavender)]/20 px-2 py-1 text-xs font-bold text-[var(--lavender-dark)]">
                    {t("dashboard.sleep.averageHours", {
                      hours: summary.sleep.avgHours,
                    })}
                  </span>
                )}
              </GlassCardHeader>

              <div className="mb-4 rounded-2xl border border-gray-50 bg-white p-5 text-center">
                {summary?.sleep.latestHours ? (
                  <>
                    <p className="text-4xl font-bold text-gray-800">
                      {Math.floor(summary.sleep.latestHours)}h{" "}
                      {Math.round((summary.sleep.latestHours % 1) * 60)}m
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs font-bold tracking-wider uppercase",
                        summary.sleep.latestQuality === "good"
                          ? "text-[var(--sage)]"
                          : summary.sleep.latestQuality === "average"
                            ? "text-orange-500"
                            : "text-red-500",
                      )}
                    >
                      {t("dashboard.sleep.qualityLabel")}{" "}
                      {summary.sleep.latestQuality === "good"
                        ? t("dashboard.sleep.qualityExcellent")
                        : summary.sleep.latestQuality === "average"
                          ? t("dashboard.sleep.qualityAverage")
                          : t("dashboard.sleep.qualityPoor")}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">{t("dashboard.sleep.noData")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-4">
                  <p className="text-[10px] font-bold text-[var(--primary-dark)] uppercase">
                    {t("dashboard.sleep.energyLabel")}
                  </p>
                  <p className="text-lg font-bold">
                    {summary?.sleep.avgEnergy ?? "-"}/10
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--lavender)]/20 bg-[var(--lavender)]/10 p-4">
                  <p className="text-[10px] font-bold text-[var(--lavender-dark)] uppercase">
                    {t("dashboard.sleep.avgMoodLabel")}
                  </p>
                  <p className="text-lg font-bold">
                    {summary?.mood.weeklyAverage ?? "-"}/10
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* 7-Day Mood Trend */}
          <GlassCard padding="lg" variant="elevated">
            <GlassCardHeader>
              <div>
                <h3 className="text-xl font-bold">
                  {t("dashboard.trend.title")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("dashboard.trend.range7d")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {summary?.mood.trendPercent !== null &&
                  summary?.mood.trendPercent !== undefined && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                        summary.mood.trendPercent >= 0
                          ? "bg-[var(--sage)]/10 text-[var(--sage-dark)]"
                          : "bg-red-100 text-red-600",
                      )}
                    >
                      <TrendingUp
                        className={cn(
                          "size-3",
                          summary.mood.trendPercent < 0 && "rotate-180",
                        )}
                      />
                      {summary.mood.trendPercent >= 0 ? "+" : ""}
                      {summary.mood.trendPercent}%
                    </div>
                  )}
              </div>
            </GlassCardHeader>

            {chartLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <MoodChart
                moodEntries={chartData?.moodEntries ?? []}
                dosageChanges={chartData?.dosageChanges ?? []}
                height={200}
                compact
              />
            )}
          </GlassCard>
        </div>

        {/* Right Column: Sidebar Stats & Caregivers */}
        <div className="space-y-8 lg:col-span-4">
          {/* Streak Card */}
          {streakLoading || !streakData ? (
            <Skeleton className="h-48 w-full rounded-[32px]" />
          ) : (
            <StreakCard
              streakDays={streakData.streakDays}
              weekProgress={streakData.weekProgress as (0 | 1)[]}
              subtitle={streakData.subtitle}
            />
          )}

          {/* Insights Section */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={
                  <Sparkles className="size-5 text-[var(--lavender-dark)]" />
                }
              >
                {t("dashboard.insights.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              {insights && insights.length > 0 ? (
                insights.slice(0, 2).map((insight, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-2xl border p-4",
                      index === 0
                        ? "border-[var(--lavender)]/20 bg-[var(--lavender)]/10"
                        : "border-[var(--sage)]/10 bg-[var(--sage)]/5",
                    )}
                  >
                    <p className="text-sm leading-relaxed text-gray-700">
                      {insight.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                  <p className="font-semibold text-gray-800">
                    {t("dashboard.insights.emptyTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {t("dashboard.insights.emptyDescription")}
                  </p>
                </div>
              )}
            </GlassCardContent>

            <Link
              href="/trends"
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-dashed border-gray-200 py-3 text-xs font-bold text-gray-400 uppercase transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {t("dashboard.insights.viewMore")}
            </Link>
          </GlassCard>

          {/* Caregivers Quick View */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Users className="size-5 text-[var(--primary)]" />}
              >
                {t("dashboard.caregivers.title")}
              </GlassCardTitle>
              <Link
                href="/caregiver"
                className="text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)]"
              >
                <PlusCircle className="size-5" />
              </Link>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              {caregiversLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : caregivers && caregivers.length > 0 ? (
                caregivers.slice(0, 2).map((caregiver) => {
                  const displayName =
                    [
                      caregiver.label,
                      caregiver.caregiverName,
                      caregiver.caregiverEmail,
                    ].find((v) => v) ?? t("dashboard.caregivers.defaultName");
                  const statusLabel =
                    caregiver.status === "pending"
                      ? t("dashboard.caregivers.statusPending")
                      : t("dashboard.caregivers.statusActive");

                  return (
                    <div key={caregiver.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="size-10 border border-white shadow-sm">
                          <AvatarImage
                            src={caregiver.caregiverImage ?? undefined}
                          />
                          <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)]">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {caregiver.status === "active" && (
                          <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-[var(--sage)]" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold">{displayName}</p>
                        <p className="text-[10px] font-medium text-gray-400">
                          {statusLabel}
                        </p>
                      </div>
                      <Link
                        href="/caregiver"
                        aria-label={t("dashboard.caregivers.open")}
                        className="flex size-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-all hover:text-[var(--primary)]"
                      >
                        <MessageSquare className="size-4" />
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="py-3 text-center text-sm text-gray-400">
                  {t("dashboard.caregivers.empty")}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </PageLayout>
  );
}

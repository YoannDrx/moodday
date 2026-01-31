"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronRight,
  Circle,
  History,
  Moon,
  MessageSquare,
  Pill,
  Plus,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
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
import { saveMoodEntry } from "@/features/mood/mood.action";
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

type DashboardContentProps = {
  userName: string;
};

export function DashboardContent({ userName }: DashboardContentProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [currentMood, setCurrentMood] = useState(7);
  const [isSaving, setIsSaving] = useState(false);

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
  const handleMedIntake = async (medicationId: string, isTaken: boolean) => {
    try {
      if (isTaken) {
        // Already taken, skip for now (could add undo functionality)
        return;
      }
      const result = await logMedIntake({ medicationId });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("medication.intake.logged"));
      void refetchMedications();
    } catch {
      toast.error(t("common.error"));
    }
  };

  // Handle skip medication
  const handleSkipMed = async (medicationId: string) => {
    try {
      const result = await skipMedIntake({ medicationId });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("medication.intake.skipped"));
      void refetchMedications();
    } catch {
      toast.error(t("common.error"));
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
      const result = await saveMoodEntry({ value: currentMood });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("mood.entry.saved"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["mood-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["streak-data"] }),
        queryClient.invalidateQueries({ queryKey: ["pattern-insights"] }),
      ]);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate taken count from real medications data
  const takenCount =
    medications?.filter((m) => m.intakes.length > 0 && !m.intakes[0].skipped)
      .length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 lg:px-6">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            {t("dashboard.greeting", { name: userName.split(" ")[0] })}
          </h1>
          <p className="text-gray-500">
            {t("dashboard.today", { date: today })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="glass-card relative flex size-12 items-center justify-center rounded-2xl text-gray-600 transition-all hover:text-[var(--primary)]">
            <Bell className="size-6" />
            <span className="absolute top-3 right-3 size-2 rounded-full bg-[var(--destructive)] ring-2 ring-white" />
          </button>
        </div>
      </header>

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
                <GlassCardBadge>{t("dashboard.quickMood.badge")}</GlassCardBadge>
              </GlassCardHeader>

              <div className="my-8">
                <MoodSlider value={currentMood} onChange={setCurrentMood} />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveMood}
                  disabled={isSaving}
                  className="shadow-soft flex-grow rounded-2xl bg-[var(--primary)] py-6 text-lg font-bold text-white transition-all hover:bg-[var(--primary-dark)] active:scale-[0.98]"
                >
                  {isSaving ? t("common.saving") : t("dashboard.quickMood.save")}
                </Button>
                <Link
                  href="/mood"
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
                  {takenCount}/{medications?.length ?? 0}
                </GlassCardBadge>
              </GlassCardHeader>

              <GlassCardContent className="space-y-3">
                {medicationsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                ) : medications && medications.length > 0 ? (
                  medications.slice(0, 3).map((med) => {
                    const isTaken =
                      med.intakes.length > 0 && !med.intakes[0].skipped;
                    const isSkipped =
                      med.intakes.length > 0 && med.intakes[0].skipped;
                    return (
                      <div
                        key={med.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all",
                          isTaken
                            ? "border-[var(--sage)]/20 bg-[var(--sage)]/10"
                            : isSkipped
                              ? "border-orange-200 bg-orange-50"
                              : "border-gray-100 bg-white hover:border-[var(--primary)]/30",
                        )}
                        onClick={() => void handleMedIntake(med.id, isTaken)}
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
                            {med.name}
                          </p>
                        <p className="text-xs text-gray-400">
                          {med.dosage} •{" "}
                          {med.frequency === "daily"
                            ? t("medication.frequencyShort.daily")
                            : med.frequency === "twice_daily"
                              ? t("medication.frequencyShort.twiceDaily")
                              : med.frequency === "weekly"
                                ? t("medication.frequencyShort.weekly")
                                : med.frequency === "prn"
                                  ? t("medication.frequencyShort.prn")
                                  : med.frequency}
                        </p>
                        </div>
                        {!isTaken && !isSkipped && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleSkipMed(med.id);
                            }}
                            className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            {t("medication.intake.skip")}
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
                <History className="size-4" /> {t("dashboard.medications.history")}
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
                  <p className="text-gray-400">
                    {t("dashboard.sleep.noData")}
                  </p>
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
                <>
                  <div className="rounded-2xl border border-[var(--lavender)]/20 bg-[var(--lavender)]/10 p-4">
                    <p className="text-sm leading-relaxed text-gray-700">
                      <span className="font-bold text-[var(--lavender-dark)]">
                        {t("dashboard.insights.detectedLabel")}
                      </span>{" "}
                      {t("dashboard.insights.sampleOne")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--sage)]/10 bg-[var(--sage)]/5 p-4">
                    <p className="text-sm leading-relaxed text-gray-700">
                      {t("dashboard.insights.sampleTwo")}
                    </p>
                  </div>
                </>
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
                      <button className="flex size-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-all hover:text-[var(--primary)]">
                        <MessageSquare className="size-4" />
                      </button>
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
    </div>
  );
}

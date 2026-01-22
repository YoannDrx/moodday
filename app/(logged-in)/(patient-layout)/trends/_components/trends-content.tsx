"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart2,
  Sparkles,
  Moon,
  Zap,
  Activity,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { MoodChart } from "@/components/nowts/mood-chart";

type MoodEntry = {
  id: string;
  value: number;
  note: string | null;
  date: string;
};

type DosageChange = {
  id: string;
  medicationName: string;
  previousDosage: string | null;
  newDosage: string;
  date: string;
};

type Insight = {
  type: "mood" | "medication" | "therapy" | "exercise";
  message: string;
  trend: "up" | "down" | "neutral";
};

type TrendsContentProps = {
  chartData7?: { moodEntries: MoodEntry[]; dosageChanges: DosageChange[] };
  chartData30?: { moodEntries: MoodEntry[]; dosageChanges: DosageChange[] };
  chartData90?: { moodEntries: MoodEntry[]; dosageChanges: DosageChange[] };
  insights?: Insight[];
};

type PeriodKey = "7" | "30" | "90";

const periodLabels: Record<PeriodKey, string> = {
  "7": "7 jours",
  "30": "30 jours",
  "90": "3 mois",
};

export function TrendsContent({
  chartData7,
  chartData30,
  chartData90,
  insights,
}: TrendsContentProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("30");

  // Calculate averages
  const calculateAverage = (entries: MoodEntry[] | undefined): string => {
    if (!entries || entries.length === 0) return "--";
    const avg = entries.reduce((sum, e) => sum + e.value, 0) / entries.length;
    return avg.toFixed(1);
  };

  const avg7 = calculateAverage(chartData7?.moodEntries);
  const avg30 = calculateAverage(chartData30?.moodEntries);
  const avg90 = calculateAverage(chartData90?.moodEntries);

  // Get current chart data
  const getCurrentChartData = () => {
    switch (selectedPeriod) {
      case "7":
        return chartData7;
      case "30":
        return chartData30;
      case "90":
        return chartData90;
      default:
        return chartData30;
    }
  };

  const currentData = getCurrentChartData();

  // Calculate trend
  const calculateTrend = (
    avg1: string,
    avg2: string,
  ): "up" | "down" | "neutral" => {
    const val1 = parseFloat(avg1);
    const val2 = parseFloat(avg2);
    if (isNaN(val1) || isNaN(val2)) return "neutral";
    const diff = val1 - val2;
    if (diff > 0.5) return "up";
    if (diff < -0.5) return "down";
    return "neutral";
  };

  const trend7vs30 = calculateTrend(avg7, avg30);

  // Insight type colors for new design
  const insightTypeStyles = {
    mood: {
      bg: "bg-[var(--primary)]/10",
      border: "border-[var(--primary)]/20",
      icon: Activity,
      iconColor: "text-[var(--primary)]",
    },
    medication: {
      bg: "bg-[var(--lavender)]/20",
      border: "border-[var(--lavender)]/30",
      icon: Pill,
      iconColor: "text-[var(--lavender-dark)]",
    },
    therapy: {
      bg: "bg-[var(--sage)]/10",
      border: "border-[var(--sage)]/20",
      icon: Sparkles,
      iconColor: "text-[var(--sage)]",
    },
    exercise: {
      bg: "bg-orange-50",
      border: "border-orange-100",
      icon: Zap,
      iconColor: "text-orange-500",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
          Tendances & Analyses
        </h1>
        <p className="text-gray-500">
          Visualisez vos patterns d&apos;humeur dans le temps
        </p>
      </header>

      {/* Period Selector */}
      <div className="mb-8 flex gap-2">
        {(["7", "30", "90"] as PeriodKey[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all",
              selectedPeriod === period
                ? "shadow-soft bg-[var(--primary)] text-white"
                : "glass-card text-gray-600 hover:bg-white",
            )}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {/* 7 Days */}
        <GlassCard
          padding="md"
          variant={selectedPeriod === "7" ? "elevated" : "default"}
          className={cn(
            "cursor-pointer transition-all",
            selectedPeriod === "7" && "ring-2 ring-[var(--primary)]/30",
          )}
          onClick={() => setSelectedPeriod("7")}
        >
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Calendar className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                7 derniers jours
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{avg7}/10</p>
                {trend7vs30 !== "neutral" && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-bold",
                      trend7vs30 === "up"
                        ? "text-[var(--sage)]"
                        : "text-red-500",
                    )}
                  >
                    {trend7vs30 === "up" ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    vs 30j
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 30 Days */}
        <GlassCard
          padding="md"
          variant={selectedPeriod === "30" ? "elevated" : "default"}
          className={cn(
            "cursor-pointer transition-all",
            selectedPeriod === "30" && "ring-2 ring-[var(--primary)]/30",
          )}
          onClick={() => setSelectedPeriod("30")}
        >
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage)]">
              <TrendingUp className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                30 derniers jours
              </p>
              <p className="text-2xl font-bold">{avg30}/10</p>
            </div>
          </div>
        </GlassCard>

        {/* 90 Days */}
        <GlassCard
          padding="md"
          variant={selectedPeriod === "90" ? "elevated" : "default"}
          className={cn(
            "cursor-pointer transition-all",
            selectedPeriod === "90" && "ring-2 ring-[var(--primary)]/30",
          )}
          onClick={() => setSelectedPeriod("90")}
        >
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)]">
              <BarChart2 className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                3 derniers mois
              </p>
              <p className="text-2xl font-bold">{avg90}/10</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Chart */}
        <div className="lg:col-span-8">
          <GlassCard padding="lg" variant="elevated">
            <GlassCardHeader>
              <div>
                <h3 className="text-xl font-bold">
                  Évolution de l&apos;humeur
                </h3>
                <p className="text-sm text-gray-500">
                  {periodLabels[selectedPeriod]}
                </p>
              </div>
              <GlassCardBadge>
                {currentData?.moodEntries.length ?? 0} entrées
              </GlassCardBadge>
            </GlassCardHeader>

            <div className="mt-4">
              <MoodChart
                moodEntries={currentData?.moodEntries ?? []}
                dosageChanges={currentData?.dosageChanges ?? []}
                height={350}
              />
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 bg-[var(--primary)]" />
                <span>Humeur</span>
              </div>
              {(currentData?.dosageChanges.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-0.5 border-l-2 border-dashed border-orange-400" />
                  <span>Changement de dosage</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Side Panel */}
        <div className="space-y-6 lg:col-span-4">
          {/* Quick Stats */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Moon className="size-5 text-[var(--lavender-dark)]" />}
              >
                Corrélations
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              <div className="rounded-2xl border border-[var(--lavender)]/20 bg-[var(--lavender)]/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Sommeil ↔ Humeur
                  </span>
                  <span className="text-lg font-bold text-[var(--lavender-dark)]">
                    78%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--lavender)]/20">
                  <div
                    className="h-full rounded-full bg-[var(--lavender-dark)]"
                    style={{ width: "78%" }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--sage)]/20 bg-[var(--sage)]/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Médicaments ↔ Stabilité
                  </span>
                  <span className="text-lg font-bold text-[var(--sage-dark)]">
                    85%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--sage)]/20">
                  <div
                    className="h-full rounded-full bg-[var(--sage)]"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Énergie ↔ Humeur
                  </span>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    92%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--primary)]/10">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: "92%" }}
                  />
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Insights */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={
                  <Sparkles className="size-5 text-[var(--lavender-dark)]" />
                }
              >
                IA Insights
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-3">
              {insights && insights.length > 0 ? (
                insights.slice(0, 4).map((insight, index) => {
                  const style = insightTypeStyles[insight.type];
                  const IconComponent = style.icon;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-4",
                        style.bg,
                        style.border,
                      )}
                    >
                      <IconComponent
                        className={cn(
                          "mt-0.5 size-5 shrink-0",
                          style.iconColor,
                        )}
                      />
                      <div>
                        <p className="text-sm leading-relaxed text-gray-700">
                          {insight.message}
                        </p>
                        {insight.trend !== "neutral" && (
                          <span
                            className={cn(
                              "mt-1 inline-flex items-center gap-1 text-xs font-bold",
                              insight.trend === "up"
                                ? "text-[var(--sage)]"
                                : "text-red-400",
                            )}
                          >
                            {insight.trend === "up" ? (
                              <TrendingUp className="size-3" />
                            ) : (
                              <TrendingDown className="size-3" />
                            )}
                            {insight.trend === "up" ? "En hausse" : "En baisse"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center">
                  <Sparkles className="mx-auto mb-2 size-8 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    Continuez à saisir vos données pour obtenir des insights
                    personnalisés.
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

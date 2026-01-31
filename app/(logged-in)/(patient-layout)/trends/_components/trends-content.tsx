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
import { useI18n } from "@/i18n/provider";

type MoodEntry = {
  id: string;
  value: number;
  note: string | null;
  energy?: number | null;
  sleepHours?: number | null;
  anxiety?: number | null;
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
  chartData7?: {
    moodEntries: MoodEntry[];
    dosageChanges: DosageChange[];
    medicationAdherence?: number | null;
  };
  chartData30?: {
    moodEntries: MoodEntry[];
    dosageChanges: DosageChange[];
    medicationAdherence?: number | null;
  };
  chartData90?: {
    moodEntries: MoodEntry[];
    dosageChanges: DosageChange[];
    medicationAdherence?: number | null;
  };
  insights?: Insight[];
};

type PeriodKey = "7" | "30" | "90";

const periodLabelKeys: Record<PeriodKey, string> = {
  "7": "trends.periods.days7",
  "30": "trends.periods.days30",
  "90": "trends.periods.days90",
};

export function TrendsContent({
  chartData7,
  chartData30,
  chartData90,
  insights,
}: TrendsContentProps) {
  const { t } = useI18n();
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

  const calculateCorrelation = (pairs: [number, number][]) => {
    if (pairs.length < 3) return null;
    const meanX = pairs.reduce((sum, [x]) => sum + x, 0) / pairs.length;
    const meanY = pairs.reduce((sum, [, y]) => sum + y, 0) / pairs.length;
    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;
    for (const [x, y] of pairs) {
      const dx = x - meanX;
      const dy = y - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }
    if (sumSqX === 0 || sumSqY === 0) return null;
    const corr = numerator / Math.sqrt(sumSqX * sumSqY);
    return Math.round(Math.abs(corr) * 100);
  };

  const buildPairs = (
    entries: MoodEntry[] | undefined,
    key: "sleepHours" | "energy" | "anxiety",
  ): [number, number][] => {
    if (!entries) return [];
    return entries
      .filter((entry) => entry[key] !== null && entry[key] !== undefined)
      .map((entry) => [entry.value, entry[key] as number] as [number, number]);
  };

  const currentData = getCurrentChartData();
  const sleepCorrelation = calculateCorrelation(
    buildPairs(currentData?.moodEntries, "sleepHours"),
  );
  const energyCorrelation = calculateCorrelation(
    buildPairs(currentData?.moodEntries, "energy"),
  );
  const medicationCorrelation = currentData?.medicationAdherence ?? null;

  const formatPercent = (value: number | null | undefined) =>
    value === null || value === undefined ? "--" : `${value}%`;

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
          {t("trends.title")}
        </h1>
        <p className="text-gray-500">
          {t("trends.subtitle")}
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
            {t(periodLabelKeys[period])}
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
                {t("trends.stats.last7Days")}
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
                    {t("trends.stats.vs30Days")}
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
                {t("trends.stats.last30Days")}
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
                {t("trends.stats.last90Days")}
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
                  {t("trends.chart.title")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t(periodLabelKeys[selectedPeriod])}
                </p>
              </div>
              <GlassCardBadge>
                {t("trends.chart.entries", {
                  count: currentData?.moodEntries.length ?? 0,
                })}
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
                <span>{t("trends.chart.legend.mood")}</span>
              </div>
              {(currentData?.dosageChanges.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-0.5 border-l-2 border-dashed border-orange-400" />
                  <span>{t("trends.chart.legend.dosageChange")}</span>
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
                {t("trends.correlations.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              <div className="rounded-2xl border border-[var(--lavender)]/20 bg-[var(--lavender)]/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {t("trends.correlations.sleepMood")}
                  </span>
                  <span className="text-lg font-bold text-[var(--lavender-dark)]">
                    {formatPercent(sleepCorrelation)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--lavender)]/20">
                  <div
                    className="h-full rounded-full bg-[var(--lavender-dark)]"
                    style={{
                      width: sleepCorrelation ? `${sleepCorrelation}%` : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--sage)]/20 bg-[var(--sage)]/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {t("trends.correlations.medicationStability")}
                  </span>
                  <span className="text-lg font-bold text-[var(--sage-dark)]">
                    {formatPercent(medicationCorrelation)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--sage)]/20">
                  <div
                    className="h-full rounded-full bg-[var(--sage)]"
                    style={{
                      width: medicationCorrelation
                        ? `${medicationCorrelation}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {t("trends.correlations.energyMood")}
                  </span>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {formatPercent(energyCorrelation)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--primary)]/10">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{
                      width: energyCorrelation ? `${energyCorrelation}%` : "0%",
                    }}
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
                {t("trends.insights.title")}
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
                            {insight.trend === "up"
                              ? t("trends.insights.trendUp")
                              : t("trends.insights.trendDown")}
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
                    {t("trends.insights.empty")}
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

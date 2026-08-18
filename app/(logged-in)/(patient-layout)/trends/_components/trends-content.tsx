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
  FileText,
  LockKeyhole,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { MoodChart } from "@/components/nowts/mood-chart";
import { useI18n } from "@/i18n/provider";
import Link from "next/link";

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
  canViewUnlimitedHistory: boolean;
  canCreateConsultationReport: boolean;
  billingEnabled: boolean;
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
  canViewUnlimitedHistory,
  canCreateConsultationReport,
  billingEnabled,
}: TrendsContentProps) {
  const { locale, t } = useI18n();
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
  const medicationAdherence = currentData?.medicationAdherence ?? null;

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
    <PageLayout
      title={t("trends.title")}
      subtitle={t("trends.subtitle")}
      maxWidth="7xl"
    >
      <div className="mb-8 overflow-hidden rounded-3xl bg-[#183432] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-bold text-[#8DDDE0]">
              <FileText className="size-4" />
              {locale === "fr" ? "Mode Consultation" : "Consultation Mode"}
            </div>
            <h2 className="mt-3 text-2xl font-bold">
              {locale === "fr"
                ? "Organisez les faits avant votre rendez-vous."
                : "Organize the facts before your appointment."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {locale === "fr"
                ? "Choisissez une période, relisez les changements et préparez vos questions. Moodday ne déduit aucune cause médicale."
                : "Choose a period, review changes, and prepare your questions. Moodday does not infer medical causes."}
            </p>
          </div>
          {canCreateConsultationReport || billingEnabled ? (
            <Link
              href={canCreateConsultationReport ? "/export" : "/pricing"}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#1E7775]"
            >
              {canCreateConsultationReport
                ? locale === "fr"
                  ? "Préparer le rapport"
                  : "Prepare report"
                : locale === "fr"
                  ? "Découvrir Plus"
                  : "Explore Plus"}
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white/70"
            >
              {locale === "fr"
                ? "PDF indisponible avant l’ouverture de Plus"
                : "PDF unavailable until Plus opens"}
            </span>
          )}
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-8 flex gap-2">
        {(["7", "30", "90"] as PeriodKey[]).map((period) => (
          <button
            key={period}
            onClick={() => {
              if (period !== "90" || canViewUnlimitedHistory) {
                setSelectedPeriod(period);
              }
            }}
            disabled={period === "90" && !canViewUnlimitedHistory}
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all",
              selectedPeriod === period
                ? "shadow-soft bg-[var(--primary)] text-white"
                : "glass-card text-gray-600 hover:bg-white",
              period === "90" &&
                !canViewUnlimitedHistory &&
                "cursor-not-allowed opacity-60",
            )}
          >
            {t(periodLabelKeys[period])}
            {period === "90" && !canViewUnlimitedHistory && (
              <LockKeyhole className="ml-1.5 inline size-3" />
            )}
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
              <p className="text-xs font-semibold text-gray-600 uppercase">
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
              <p className="text-xs font-semibold text-gray-600 uppercase">
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
          onClick={() => {
            if (canViewUnlimitedHistory) setSelectedPeriod("90");
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)]">
              <BarChart2 className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">
                {t("trends.stats.last90Days")}
              </p>
              <p className="text-2xl font-bold">
                {canViewUnlimitedHistory
                  ? `${avg90}/10`
                  : billingEnabled
                    ? "Plus"
                    : locale === "fr"
                      ? "Indisponible"
                      : "Unavailable"}
              </p>
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
                <h3 className="text-xl font-bold">{t("trends.chart.title")}</h3>
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
                    {t("trends.correlations.medicationAdherence")}
                  </span>
                  <span className="text-lg font-bold text-[var(--sage-dark)]">
                    {formatPercent(medicationAdherence)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--sage)]/20">
                  <div
                    className="h-full rounded-full bg-[var(--sage)]"
                    style={{
                      width: medicationAdherence
                        ? `${medicationAdherence}%`
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
              <p className="text-muted-foreground text-xs leading-5">
                {locale === "fr"
                  ? "Ces indicateurs décrivent une association dans vos saisies. Ils ne démontrent ni cause, ni effet médical."
                  : "These indicators describe an association in your entries. They do not establish a cause or medical effect."}
              </p>
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
                  <p className="text-sm text-gray-600">
                    {t("trends.insights.empty")}
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </PageLayout>
  );
}

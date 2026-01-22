"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Pill,
  Calendar,
  Dumbbell,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MoodChart } from "@/components/nowts/mood-chart";
import { InsightCard } from "@/components/nowts/insight-card";
import {
  getDashboardSummary,
  getMoodChartData,
  getPatternInsights,
} from "@/features/insights/insights.action";
import { useI18n } from "@/i18n/provider";

export function DashboardSummary() {
  const { t } = useI18n();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const result = await getDashboardSummary();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["mood-chart", 30],
    queryFn: async () => {
      const result = await getMoodChartData({ days: 30 });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["pattern-insights"],
    queryFn: async () => {
      const result = await getPatternInsights();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  if (summaryLoading || chartLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Mood Card */}
        <Link href="/mood/history">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("insights.dashboard.mood.title")}
              </CardTitle>
              <Heart className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {summary?.mood.weeklyAverage !== null ? (
                <>
                  <div className="text-2xl font-bold">
                    {summary?.mood.weeklyAverage}/10
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("insights.dashboard.mood.average")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("insights.dashboard.mood.noData")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Medications Card */}
        <Link href="/medications/today">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("insights.dashboard.medications.title")}
              </CardTitle>
              <Pill className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {summary?.medications.totalActive !== undefined &&
              summary.medications.totalActive > 0 ? (
                <>
                  <div className="text-2xl font-bold">
                    {summary.medications.takenToday}/
                    {summary.medications.totalActive}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {summary.medications.adherencePercent !== null
                      ? t("insights.dashboard.medications.adherence", {
                          percent: summary.medications.adherencePercent,
                        })
                      : t("insights.dashboard.medications.taken", {
                          count: summary.medications.takenToday,
                        })}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("insights.dashboard.medications.noMeds")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Therapy Card */}
        <Link href="/therapy">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("insights.dashboard.therapy.title")}
              </CardTitle>
              <Calendar className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {summary?.therapy.sessionsThisMonth !== undefined &&
              summary.therapy.sessionsThisMonth > 0 ? (
                <>
                  <div className="text-2xl font-bold">
                    {summary.therapy.sessionsThisMonth}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("insights.dashboard.therapy.sessions", {
                      count: summary.therapy.sessionsThisMonth,
                    })}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("insights.dashboard.therapy.noSessions")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Exercises Card */}
        <Link href="/exercises">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("insights.dashboard.exercises.title")}
              </CardTitle>
              <Dumbbell className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {summary?.exercises.completionsThisWeek !== undefined &&
              summary.exercises.completionsThisWeek > 0 ? (
                <>
                  <div className="text-2xl font-bold">
                    {summary.exercises.completionsThisWeek}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("insights.dashboard.exercises.completed", {
                      count: summary.exercises.completionsThisWeek,
                    })}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("insights.dashboard.exercises.noExercises")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mood Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            {t("insights.chart.title")}
          </CardTitle>
          <Link
            href="/mood/history"
            className="text-muted-foreground hover:text-foreground flex items-center text-sm"
          >
            {t("insights.dashboard.mood.title")}
            <ChevronRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <MoodChart
            moodEntries={chartData?.moodEntries ?? []}
            dosageChanges={chartData?.dosageChanges ?? []}
            height={300}
          />
        </CardContent>
      </Card>

      {/* Pattern Insights */}
      {!insightsLoading && insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("insights.patterns.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type}
                message={insight.message}
                trend={insight.trend}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!insightsLoading && (!insights || insights.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("insights.patterns.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground py-4 text-center">
              {t("insights.patterns.noInsights")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

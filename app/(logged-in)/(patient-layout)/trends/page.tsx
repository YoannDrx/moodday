import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { PageHeader } from "@/components/nowts/layout-components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoodChart } from "@/components/nowts/mood-chart";
import { InsightCard } from "@/components/nowts/insight-card";
import {
  getMoodChartData,
  getPatternInsights,
} from "@/features/insights/insights.action";
import { TrendingUp, Calendar, BarChart2 } from "lucide-react";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: "Tendances",
    description: t("insights.chart.title"),
  };
});

export default async function TrendsPage() {
  const { t } = await getI18n();

  // Fetch data server-side
  const [chartResult7, chartResult30, chartResult90, insightsResult] =
    await Promise.all([
      getMoodChartData({ days: 7 }),
      getMoodChartData({ days: 30 }),
      getMoodChartData({ days: 90 }),
      getPatternInsights(),
    ]);

  const chartData7 = chartResult7.data;
  const chartData30 = chartResult30.data;
  const chartData90 = chartResult90.data;
  const insights = insightsResult.data;

  // Calculate averages
  const avg7 =
    chartData7?.moodEntries && chartData7.moodEntries.length > 0
      ? (
          chartData7.moodEntries.reduce((sum, e) => sum + e.value, 0) /
          chartData7.moodEntries.length
        ).toFixed(1)
      : "--";

  const avg30 =
    chartData30?.moodEntries && chartData30.moodEntries.length > 0
      ? (
          chartData30.moodEntries.reduce((sum, e) => sum + e.value, 0) /
          chartData30.moodEntries.length
        ).toFixed(1)
      : "--";

  const avg90 =
    chartData90?.moodEntries && chartData90.moodEntries.length > 0
      ? (
          chartData90.moodEntries.reduce((sum, e) => sum + e.value, 0) /
          chartData90.moodEntries.length
        ).toFixed(1)
      : "--";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Tendances"
        description="Analyse tes patterns d'humeur dans le temps"
      />

      {/* Stats Summary */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Calendar className="size-6 text-blue-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">7 derniers jours</p>
              <p className="text-2xl font-bold">{avg7}/10</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <TrendingUp className="size-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">30 derniers jours</p>
              <p className="text-2xl font-bold">{avg30}/10</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-500/10 p-3">
              <BarChart2 className="size-6 text-purple-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">90 derniers jours</p>
              <p className="text-2xl font-bold">{avg90}/10</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart 30 days */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            {t("insights.chart.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MoodChart
            moodEntries={chartData30?.moodEntries ?? []}
            dosageChanges={chartData30?.dosageChanges ?? []}
            height={350}
          />
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{t("insights.patterns.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {insights && insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <InsightCard
                  key={index}
                  type={insight.type}
                  message={insight.message}
                  trend={insight.trend}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              {t("insights.patterns.noInsights")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

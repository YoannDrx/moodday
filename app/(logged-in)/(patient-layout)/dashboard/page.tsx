import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { BarChart3 } from "lucide-react";

import { DashboardStats } from "@/features/dashboard/dashboard-stats";
import { TodayMoodCard } from "@/features/dashboard/today-mood-card";
import {
  QuickAccessCard,
  SectionTitle,
} from "@/components/nowts/layout-components";
import { MoodChart } from "@/components/nowts/mood-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMoodChartData } from "@/features/insights/insights.action";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("insights.title"),
    description: t("insights.title"),
  };
});

export default async function DashboardPage() {
  const { t } = await getI18n();

  // Fetch chart data server-side
  const chartResult = await getMoodChartData({ days: 30 });
  const chartData = chartResult.data;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("insights.title")}</h1>

      {/* Stats Grid */}
      <DashboardStats className="mb-8" />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Mood Entry + Chart */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Mood Card */}
          <TodayMoodCard />

          {/* Mood Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                {t("insights.chart.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoodChart
                moodEntries={chartData?.moodEntries ?? []}
                dosageChanges={chartData?.dosageChanges ?? []}
                height={300}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Access */}
        <div className="space-y-6">
          <SectionTitle title="Accès rapide" />

          <div className="space-y-3">
            <QuickAccessCard
              title={t("patient.nav.mood")}
              subtitle="Historique complet"
              href="/mood"
              iconName="Heart"
            />
            <QuickAccessCard
              title={t("patient.nav.medications")}
              subtitle="Prises du jour"
              href="/medications/today"
              iconName="Pill"
            />
            <QuickAccessCard
              title="Tendances"
              subtitle="Analyses détaillées"
              href="/trends"
              iconName="BarChart3"
            />
            <QuickAccessCard
              title="Ressources de crise"
              subtitle="Aide immédiate"
              href="/crisis"
              iconName="HeartHandshake"
            />
            <QuickAccessCard
              title={t("patient.nav.export")}
              subtitle="PDF pour médecin"
              href="/export"
              iconName="FileText"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

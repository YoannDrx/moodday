import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import {
  getMoodChartData,
  getPatternInsights,
} from "@/features/insights/insights.action";

import { TrendsContent } from "./_components/trends-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: "Tendances",
    description: t("insights.chart.title"),
  };
});

export default async function TrendsPage() {
  // Fetch data server-side
  const [chartResult7, chartResult30, chartResult90, insightsResult] =
    await Promise.all([
      getMoodChartData({ days: 7 }),
      getMoodChartData({ days: 30 }),
      getMoodChartData({ days: 90 }),
      getPatternInsights(),
    ]);

  return (
    <TrendsContent
      chartData7={chartResult7.data}
      chartData30={chartResult30.data}
      chartData90={chartResult90.data}
      insights={insightsResult.data}
    />
  );
}

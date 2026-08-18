import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import {
  getMoodChartData,
  getPatternInsights,
} from "@/features/insights/insights.action";

import { TrendsContent } from "./_components/trends-content";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getFeatureAvailability } from "@/lib/features/availability";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("trends.metaTitle"),
    description: t("trends.metaDescription"),
  };
});

export default async function TrendsPage() {
  const user = await getRequiredUser();
  // Fetch data server-side
  const [
    chartResult7,
    chartResult30,
    chartResult90,
    insightsResult,
    subscription,
  ] = await Promise.all([
    getMoodChartData({ days: 7 }),
    getMoodChartData({ days: 30 }),
    getMoodChartData({ days: 90 }),
    getPatternInsights(),
    prisma.subscription.findUnique({ where: { referenceId: user.id } }),
  ]);

  return (
    <TrendsContent
      chartData7={chartResult7.data}
      chartData30={chartResult30.data}
      chartData90={chartResult90.data}
      insights={insightsResult.data}
      canViewUnlimitedHistory={
        getEntitlements(subscription).analyticsWindowDays === null
      }
      canCreateConsultationReport={
        getEntitlements(subscription).consultationReports
      }
      billingEnabled={getFeatureAvailability("billing").enabled}
    />
  );
}

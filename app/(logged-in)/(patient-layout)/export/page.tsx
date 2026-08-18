import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { ExportForm } from "./_components/export-form";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getFeatureAvailability } from "@/lib/features/availability";

const addDaysToDateKey = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("export.title"),
    description: t("export.description"),
  };
});

export default async function ExportPage() {
  const { t } = await getI18n();
  const user = await getRequiredUser();
  const [preferences, subscription] = await Promise.all([
    prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    }),
    prisma.subscription.findUnique({ where: { referenceId: user.id } }),
  ]);
  const initialEndDate = getDateKeyForTimeZone(
    new Date(),
    preferences?.timezone,
  );
  const initialStartDate = addDaysToDateKey(initialEndDate, -30);

  return (
    <PageLayout
      title={t("export.title")}
      subtitle={t("export.description")}
      maxWidth="4xl"
    >
      <ExportForm
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        canCreateConsultationReport={
          getEntitlements(subscription).consultationReports
        }
        billingEnabled={getFeatureAvailability("billing").enabled}
      />
    </PageLayout>
  );
}

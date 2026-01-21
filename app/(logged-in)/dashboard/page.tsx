import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { DashboardSummary } from "./_components/dashboard-summary";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("insights.title"),
    description: t("insights.title"),
  };
});

export default async function DashboardPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("insights.title")}</h1>
      <DashboardSummary />
    </div>
  );
}

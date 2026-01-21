import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { TodayMedications } from "./_components/today-medications";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.today.title"),
    description: t("medication.today.title"),
  };
});

export default async function TodayMedicationsPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{t("medication.today.title")}</h1>
      <p className="text-muted-foreground mb-6">
        {t("medication.today.subtitle")}
      </p>
      <TodayMedications />
    </div>
  );
}

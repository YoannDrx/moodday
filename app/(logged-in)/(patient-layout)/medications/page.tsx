import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { MedicationList } from "./_components/medication-list";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.list.title"),
    description: t("medication.list.title"),
  };
});

export default async function MedicationsPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("medication.list.title")}</h1>
      <MedicationList />
    </div>
  );
}

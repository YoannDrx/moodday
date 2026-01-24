import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { AddMedicationForm } from "./_components/add-medication-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.add.title"),
    description: t("medication.add.description"),
  };
});

export default async function AddMedicationPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("medication.add.title")}</h1>
      <AddMedicationForm />
    </div>
  );
}

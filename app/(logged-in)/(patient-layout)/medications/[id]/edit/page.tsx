import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { EditMedicationForm } from "./_components/edit-medication-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.edit.title"),
    description: t("medication.edit.title"),
  };
});

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditMedicationPage({ params }: Props) {
  const { id } = await params;
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("medication.edit.title")}</h1>
      <EditMedicationForm medicationId={id} />
    </div>
  );
}

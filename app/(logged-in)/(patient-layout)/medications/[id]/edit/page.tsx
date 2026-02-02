import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
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
    <PageLayout
      title={t("medication.edit.title")}
      maxWidth="3xl"
      showBlobs={false}
    >
      <EditMedicationForm medicationId={id} />
    </PageLayout>
  );
}

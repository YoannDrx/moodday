import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
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
    <PageLayout
      title={t("medication.add.title")}
      maxWidth="3xl"
      showBlobs={false}
    >
      <AddMedicationForm />
    </PageLayout>
  );
}

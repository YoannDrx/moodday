import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { MedicationDetail } from "./_components/medication-detail";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.detail.title"),
    description: t("medication.detail.title"),
  };
});

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MedicationDetailPage({ params }: Props) {
  const { id } = await params;
  const { t } = await getI18n();

  return (
    <PageLayout
      title={t("medication.detail.title")}
      maxWidth="3xl"
      showBlobs={false}
    >
      <MedicationDetail medicationId={id} />
    </PageLayout>
  );
}

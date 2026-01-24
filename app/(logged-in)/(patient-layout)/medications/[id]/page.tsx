import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {t("medication.detail.title")}
      </h1>
      <MedicationDetail medicationId={id} />
    </div>
  );
}

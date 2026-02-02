import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { AddTherapySessionForm } from "./_components/add-therapy-session-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("therapy.add.title"),
    description: t("therapy.add.title"),
  };
});

export default async function NewTherapySessionPage() {
  const { t } = await getI18n();

  return (
    <PageLayout
      title={t("therapy.add.title")}
      subtitle={t("therapy.add.description")}
      maxWidth="3xl"
      showBlobs={false}
    >
      <AddTherapySessionForm />
    </PageLayout>
  );
}

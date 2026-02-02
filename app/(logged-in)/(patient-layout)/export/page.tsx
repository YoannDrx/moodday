import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { ExportForm } from "./_components/export-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("export.title"),
    description: t("export.description"),
  };
});

export default async function ExportPage() {
  const { t } = await getI18n();

  return (
    <PageLayout
      title={t("export.title")}
      subtitle={t("export.description")}
      maxWidth="4xl"
    >
      <ExportForm />
    </PageLayout>
  );
}

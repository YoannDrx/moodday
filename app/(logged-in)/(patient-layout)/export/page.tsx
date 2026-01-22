import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{t("export.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("export.description")}</p>
      <ExportForm />
    </div>
  );
}

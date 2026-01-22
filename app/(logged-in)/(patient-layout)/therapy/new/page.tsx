import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{t("therapy.add.title")}</h1>
      <p className="text-muted-foreground mb-6">
        {t("therapy.add.description")}
      </p>
      <AddTherapySessionForm />
    </div>
  );
}

import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { SettingsForm } from "./_components/settings-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.title"),
    description: t("settings.title"),
  };
});

export default async function SettingsPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("settings.title")}</h1>
      <SettingsForm />
    </div>
  );
}

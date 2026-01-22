import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { SettingsContent } from "./_components/settings-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.title"),
    description: t("settings.title"),
  };
});

export default function SettingsPage() {
  return <SettingsContent />;
}

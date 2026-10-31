import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { AppearanceContent } from "./_components/appearance-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.appearance.title"),
    description: t("settings.subtitle"),
  };
});

export default function AppearancePage() {
  return <AppearanceContent />;
}

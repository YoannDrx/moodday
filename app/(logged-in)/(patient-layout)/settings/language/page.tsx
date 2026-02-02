import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { LanguageContent } from "./_components/language-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.tabs.language"),
    description: t("settings.subtitle"),
  };
});

export default function LanguagePage() {
  return <LanguageContent />;
}

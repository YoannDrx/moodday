import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { PrivacyContent } from "./_components/privacy-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.privacy.title"),
    description: t("settings.subtitle"),
  };
});

export default function PrivacyPage() {
  return <PrivacyContent />;
}

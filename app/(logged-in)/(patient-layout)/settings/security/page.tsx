import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { SecurityContent } from "./_components/security-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.tabs.security"),
    description: t("settings.subtitle"),
  };
});

export default function SecurityPage() {
  return <SecurityContent />;
}

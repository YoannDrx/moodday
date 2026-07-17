import { getI18n } from "@/i18n/server";
import { combineWithParentMetadata } from "@/lib/metadata";

import { OfflineSyncContent } from "./_components/offline-sync-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.offline.title"),
    description: t("settings.offline.subtitle"),
  };
});

export default function OfflineSyncPage() {
  return <OfflineSyncContent />;
}

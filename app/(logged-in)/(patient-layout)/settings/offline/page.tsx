import { getI18n } from "@/i18n/server";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getRequiredUser } from "@/lib/auth/auth-user";

import { OfflineSyncContent } from "./_components/offline-sync-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.offline.title"),
    description: t("settings.offline.subtitle"),
  };
});

export default async function OfflineSyncPage() {
  const user = await getRequiredUser();
  return <OfflineSyncContent ownerId={user.id} />;
}

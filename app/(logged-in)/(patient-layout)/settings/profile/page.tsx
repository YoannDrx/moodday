import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { ProfileContent } from "./_components/profile-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.profile.title"),
    description: t("settings.subtitle"),
  };
});

export default function ProfilePage() {
  return <ProfileContent />;
}

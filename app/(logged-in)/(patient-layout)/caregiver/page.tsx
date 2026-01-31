import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { CaregiverContent } from "./_components/caregiver-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("caregiver.dashboard.metaTitle"),
    description: t("caregiver.dashboard.metaDescription"),
  };
});

export default function CaregiverPage() {
  return <CaregiverContent />;
}

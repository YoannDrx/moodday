import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { CaregiverContent } from "./_components/caregiver-content";
import { getFeatureAvailability } from "@/lib/features/availability";
import { notFound } from "next/navigation";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("caregiver.dashboard.metaTitle"),
    description: t("caregiver.dashboard.metaDescription"),
  };
});

export default function CaregiverPage() {
  if (!getFeatureAvailability("caregiverSharing").enabled) {
    notFound();
  }

  return <CaregiverContent />;
}

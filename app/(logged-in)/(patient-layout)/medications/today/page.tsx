import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { TodayContent } from "./_components/today-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.today.title"),
    description: t("medication.today.title"),
  };
});

export default function TodayMedicationsPage() {
  return <TodayContent />;
}

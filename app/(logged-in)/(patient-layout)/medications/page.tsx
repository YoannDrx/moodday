import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { MedicationsContent } from "./_components/medications-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.list.title"),
    description: t("medication.list.title"),
  };
});

export default function MedicationsPage() {
  return <MedicationsContent />;
}

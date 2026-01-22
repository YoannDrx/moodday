import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { JournalWizard } from "./_components/journal-wizard";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("patient.nav.mood"),
    description: "Journal détaillé de votre journée",
  };
});

export default function MoodPage() {
  return <JournalWizard />;
}

import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { MoodHistoryList } from "./_components/mood-history-list";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("mood.history.title"),
    description: t("mood.history.title"),
  };
});

export default async function MoodHistoryPage() {
  const { t } = await getI18n();

  return (
    <PageLayout title={t("mood.history.title")} maxWidth="5xl">
      <MoodHistoryList />
    </PageLayout>
  );
}

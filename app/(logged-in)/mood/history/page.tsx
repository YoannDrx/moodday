import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("mood.history.title")}</h1>
      <MoodHistoryList />
    </div>
  );
}

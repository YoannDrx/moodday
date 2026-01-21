import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { TherapySessionList } from "./_components/therapy-session-list";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("therapy.list.title"),
    description: t("therapy.list.title"),
  };
});

export default async function TherapyPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("therapy.list.title")}</h1>
      <TherapySessionList />
    </div>
  );
}

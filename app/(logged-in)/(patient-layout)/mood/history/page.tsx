import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { MoodHistoryList } from "./_components/mood-history-list";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("mood.history.title"),
    description: t("mood.history.title"),
  };
});

export default async function MoodHistoryPage() {
  const [{ t }, user] = await Promise.all([getI18n(), getRequiredUser()]);
  const customTags = await prisma.moodTagDefinition.findMany({
    where: { userId: user.id, isArchived: false },
    select: { id: true, displayLabel: true, category: true, color: true },
    orderBy: [{ category: "asc" }, { displayLabel: "asc" }],
    take: 100,
  });

  return (
    <PageLayout title={t("mood.history.title")} maxWidth="5xl">
      <MoodHistoryList initialCustomTags={customTags} />
    </PageLayout>
  );
}

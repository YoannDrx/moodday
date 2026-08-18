import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { JournalWizard } from "./_components/journal-wizard";
import { isAiInsightsAvailableForUser } from "@/lib/features/availability";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("patient.nav.mood"),
    description: t("mood.page.description"),
  };
});

export default async function MoodPage() {
  const user = await getRequiredUser();
  const customTags = await prisma.moodTagDefinition.findMany({
    where: { userId: user.id, isArchived: false },
    select: { id: true, displayLabel: true, category: true, color: true },
    orderBy: [{ category: "asc" }, { displayLabel: "asc" }],
    take: 100,
  });

  return (
    <JournalWizard
      aiAvailable={isAiInsightsAvailableForUser(user.id)}
      customTags={customTags}
    />
  );
}

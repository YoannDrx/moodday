import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import { prisma } from "@/lib/prisma";

import { PrivacyContent } from "./_components/privacy-content";
import {
  getFeatureAvailability,
  isAiInsightsAvailableForUser,
} from "@/lib/features/availability";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.privacy.title"),
    description: t("settings.subtitle"),
  };
});

export default async function PrivacyPage() {
  const user = await getRequiredCurrentUser();
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
    select: {
      aiInsightsEnabled: true,
      aiJournalNotesEnabled: true,
    },
  });

  return (
    <PrivacyContent
      initialAiEnabled={preferences?.aiInsightsEnabled ?? false}
      initialJournalNotesEnabled={preferences?.aiJournalNotesEnabled ?? false}
      aiAvailable={isAiInsightsAvailableForUser(user.id)}
      importAvailable={getFeatureAvailability("accountImport").enabled}
    />
  );
}

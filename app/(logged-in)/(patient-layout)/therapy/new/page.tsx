import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
import { AddTherapySessionForm } from "./_components/add-therapy-session-form";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("therapy.add.title"),
    description: t("therapy.add.title"),
  };
});

export default async function NewTherapySessionPage() {
  const { t } = await getI18n();
  const user = await getRequiredUser();
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
    select: { timezone: true },
  });
  const timezone = getSafeTimeZone(preferences?.timezone);
  const todayDate = getDateKeyForTimeZone(new Date(), timezone);

  return (
    <PageLayout
      title={t("therapy.add.title")}
      subtitle={t("therapy.add.description")}
      maxWidth="3xl"
      showBlobs={false}
    >
      <AddTherapySessionForm todayDate={todayDate} />
    </PageLayout>
  );
}

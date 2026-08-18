import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";

import { TodayContent } from "./_components/today-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("medication.today.title"),
    description: t("medication.today.title"),
  };
});

export default async function TodayMedicationsPage() {
  const user = await getRequiredUser();
  return <TodayContent ownerId={user.id} />;
}

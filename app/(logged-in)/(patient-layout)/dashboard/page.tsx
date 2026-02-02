import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";

import { DashboardContent } from "./_components/dashboard-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("insights.title"),
    description: t("insights.title"),
  };
});

export default async function DashboardPage() {
  const { t } = await getI18n();
  const user = await getRequiredUser();

  return (
    <DashboardContent userName={user.name || t("dashboard.defaultName")} />
  );
}

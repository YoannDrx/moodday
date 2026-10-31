import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { NotificationsContent } from "./_components/notifications-content";
import { getFeatureAvailability } from "@/lib/features/availability";
import { notFound } from "next/navigation";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.notifications.title"),
    description: t("settings.subtitle"),
  };
});

export default function NotificationsPage() {
  if (!getFeatureAvailability("pushNotifications").enabled) notFound();
  return <NotificationsContent />;
}

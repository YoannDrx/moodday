import { getI18n } from "@/i18n/server";
import { getFeatureAvailability } from "@/lib/features/availability";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import { CalendarConnectionsContent } from "./_components/calendar-connections-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.connections.title"),
    description: t("settings.connections.subtitle"),
  };
});

export default async function ConnectionsPage() {
  await getRequiredCurrentUser();
  return (
    <CalendarConnectionsContent
      googleCalendarAvailable={
        getFeatureAvailability("googleCalendar").enabled
      }
    />
  );
}

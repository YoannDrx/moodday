import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import { TodayView } from "@/features/v2/today/today-view";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("insights.title"),
    description: t("insights.title"),
  };
});

export default async function DashboardPage() {
  const { locale, t } = await getI18n();
  const user = await getRequiredUser();
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
    select: { timezone: true },
  });
  const timezone = preferences?.timezone ?? "Europe/Paris";
  const localDate = getDateKeyForTimeZone(new Date(), timezone);
  const localeCode = locale === "fr" ? "fr-FR" : "en-US";
  const today = new Intl.DateTimeFormat(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(new Date());

  const [initialCheckIn, nextAppointment] = await Promise.all([
    prisma.checkIn.findFirst({
      where: { userId: user.id, localDate },
      orderBy: { createdAt: "desc" },
      select: { depth: true },
    }),
    prisma.appointment.findFirst({
      where: {
        userId: user.id,
        status: "scheduled",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      select: { title: true, startsAt: true },
    }),
  ]);

  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <TodayView
        firstName={(user.name || t("dashboard.defaultName")).split(" ")[0] ?? ""}
        dateLabel={today}
        localDate={localDate}
        timezone={timezone}
        locale={locale === "fr" ? "fr" : "en"}
        initialCheckIn={initialCheckIn}
        nextAppointment={
          nextAppointment
            ? {
                title: nextAppointment.title,
                dateLabel: new Intl.DateTimeFormat(localeCode, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: timezone,
                }).format(nextAppointment.startsAt),
              }
            : null
        }
      />
    </main>
  );
}

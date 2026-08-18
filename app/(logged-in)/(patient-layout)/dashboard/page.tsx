import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { PageLayoutShell } from "@/components/nowts/page-layout-shell";
import { prisma } from "@/lib/prisma";
import { Bell } from "lucide-react";
import Link from "next/link";

import { DashboardContent } from "./_components/dashboard-content";

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
  const today = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: preferences?.timezone ?? "Europe/Paris",
  }).format(new Date());

  return (
    <PageLayoutShell
      title={t("dashboard.greeting", {
        name: (user.name || t("dashboard.defaultName")).split(" ")[0],
      })}
      subtitle={t("dashboard.today", { date: today })}
      headerRight={
        <Link
          href="/settings/notifications"
          aria-label={t("settings.sidebar.notifications")}
          className="glass-card flex size-12 items-center justify-center rounded-2xl text-gray-600 transition-all hover:text-[var(--primary)]"
        >
          <Bell className="size-6" />
        </Link>
      }
    >
      <DashboardContent />
    </PageLayoutShell>
  );
}

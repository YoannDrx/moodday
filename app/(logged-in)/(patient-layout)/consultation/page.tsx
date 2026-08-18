import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  addCivilDays,
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { ConsultationPreparationEditor } from "./consultation-preparation-editor";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getFeatureAvailability } from "@/lib/features/availability";

export const metadata = { title: "Préparer une consultation" };

export default async function ConsultationPage() {
  const user = await getRequiredUser();
  const [preparations, preferences, subscription] = await Promise.all([
    prisma.consultationPreparation.findMany({
      where: { userId: user.id, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    }),
    prisma.subscription.findUnique({ where: { referenceId: user.id } }),
  ]);
  const timezone = getSafeTimeZone(preferences?.timezone);
  const todayDate = getDateKeyForTimeZone(new Date(), timezone);
  return (
    <ConsultationPreparationEditor
      preparations={preparations}
      todayDate={todayDate}
      initialStartDate={addCivilDays(todayDate, -30)}
      timezone={timezone}
      canCreateReport={getEntitlements(subscription).consultationReports}
      billingEnabled={getFeatureAvailability("billing").enabled}
    />
  );
}

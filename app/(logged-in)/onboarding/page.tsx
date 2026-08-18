import { redirect } from "next/navigation";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./_components/onboarding-wizard";
import { getFeatureAvailability } from "@/lib/features/availability";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("onboarding.title"),
    description: t("onboarding.title"),
  };
});

export default async function OnboardingPage() {
  const user = await getRequiredUser();

  // Check if onboarding is already completed
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
  });

  if (preferences?.hasCompletedOnboarding) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      pushNotificationsEnabled={
        getFeatureAvailability("pushNotifications").enabled
      }
      caregiverSharingEnabled={
        getFeatureAvailability("caregiverSharing").enabled
      }
    />
  );
}

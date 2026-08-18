import { ImmersiveLanding } from "@/features/landing/immersive-landing";
import { getFeatureAvailability } from "@/lib/features/availability";

export default function HomePage() {
  return (
    <ImmersiveLanding
      billingEnabled={getFeatureAvailability("billing").enabled}
      aiInsightsEnabled={getFeatureAvailability("aiInsights").enabled}
      caregiverSharingEnabled={
        getFeatureAvailability("caregiverSharing").enabled
      }
    />
  );
}

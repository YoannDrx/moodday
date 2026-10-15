import { ImmersiveLanding } from "@/features/landing/immersive-landing";
import { getFeatureAvailability } from "@/lib/features/availability";

import { env } from "@/lib/env";

export default function HomePage() {
  return (
    <ImmersiveLanding
      signupMode={env.PUBLIC_SIGNUP_MODE}
      billingEnabled={getFeatureAvailability("billing").enabled}
      aiInsightsEnabled={getFeatureAvailability("aiInsights").enabled}
      caregiverSharingEnabled={
        getFeatureAvailability("caregiverSharing").enabled
      }
    />
  );
}

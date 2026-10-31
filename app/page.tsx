import { BaseLayout } from "@/features/layout/base-layout";
import { LandingPage } from "@/features/landing/landing-page";
import { getFeatureAvailability } from "@/lib/features/availability";
import { env } from "@/lib/env";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <BaseLayout>
      <Suspense>
        <LandingPage
          signupMode={env.PUBLIC_SIGNUP_MODE}
          billingEnabled={getFeatureAvailability("billing").enabled}
        />
      </Suspense>
    </BaseLayout>
  );
}

import { MooddayCta } from "@/features/landing/moodday-cta";
import { MooddayFaq } from "@/features/landing/moodday-faq";
import { MooddayFeatures } from "@/features/landing/moodday-features";
import { MooddayFooter } from "@/features/landing/moodday-footer";
import { MooddayHeader } from "@/features/landing/moodday-header";
import { MooddayHero } from "@/features/landing/moodday-hero";
import { MooddayPricing } from "@/features/landing/moodday-pricing";
import { MooddayRoles } from "@/features/landing/moodday-roles";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MooddayHeader />
      <main>
        <MooddayHero />
        <MooddayFeatures />
        <MooddayRoles />
        <MooddayPricing />
        <MooddayFaq />
        <MooddayCta />
      </main>
      <MooddayFooter />
    </div>
  );
}

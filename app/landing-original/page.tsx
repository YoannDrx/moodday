import { MooddayCta } from "@/features/landing/moodday-cta";
import { MooddayFaq } from "@/features/landing/moodday-faq";
import { MooddayFeatures } from "@/features/landing/moodday-features";
import { MooddayFooter } from "@/features/landing/moodday-footer";
import { MooddayHeader } from "@/features/landing/moodday-header";
import { MooddayHero } from "@/features/landing/moodday-hero";
import { MooddayNewsletter } from "@/features/landing/moodday-newsletter";
import { MooddayPricing } from "@/features/landing/moodday-pricing";
import { MooddayRoles } from "@/features/landing/moodday-roles";

export default function LandingOriginalPage() {
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
        <MooddayNewsletter />
      </main>
      <MooddayFooter />
    </div>
  );
}

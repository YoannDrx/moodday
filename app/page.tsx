import {
  NavbarDark,
  HeroHybrid,
  FeaturesGrid,
  SectionStats,
  SectionRoles,
  SectionJourneyEnhanced,
  SectionSecurity,
  SectionFaq,
  SectionCtaHybrid,
  FooterDark,
} from "@/features/landing";
import { Pricing } from "@/features/plans/pricing-section";

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      <NavbarDark />
      <main>
        <HeroHybrid />
        <SectionStats />
        <FeaturesGrid />
        <SectionRoles />
        <SectionJourneyEnhanced />
        <SectionSecurity />
        <Pricing mode="landing" />
        <SectionFaq />
        <SectionCtaHybrid />
      </main>
      <FooterDark />
    </div>
  );
}

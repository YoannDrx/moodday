import {
  NavbarDark,
  HeroHybrid,
  FeaturesGrid,
  SectionStats,
  SectionRoles,
  SectionJourneyEnhanced,
  SectionSecurity,
  PricingLanding2,
  SectionFaq,
  SectionCtaHybrid,
  FooterDark,
} from "@/features/landing";

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
        <PricingLanding2 />
        <SectionFaq />
        <SectionCtaHybrid />
      </main>
      <FooterDark />
    </div>
  );
}

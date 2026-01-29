import {
  NavbarDark,
  HeroDashboard,
  FeaturesHorizontal,
  SectionStats,
  SectionRoles,
  SectionMarieJourney,
  SectionSecurity,
  SectionAppComing,
  PricingLanding2,
  FooterDark,
} from "@/features/landing-variants/landing-2";

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      <NavbarDark />
      <main>
        <HeroDashboard />
        <SectionStats />
        <FeaturesHorizontal />
        <SectionRoles />
        <SectionMarieJourney />
        <SectionSecurity />
        <SectionAppComing />
        <PricingLanding2 />
      </main>
      <FooterDark />
    </div>
  );
}

import {
  NavbarZen,
  HeroZen,
  SectionStone,
  SectionWater,
  SectionBamboo,
  FeaturesZen,
  TestimonialZen,
  CtaZen,
  FooterZen,
} from "@/features/landing-variants/landing-3";

export default function Landing3Page() {
  return (
    <div className="min-h-screen">
      <NavbarZen />
      <main>
        <HeroZen />
        <SectionStone />
        <SectionWater />
        <SectionBamboo />
        <FeaturesZen />
        <TestimonialZen />
        <CtaZen />
      </main>
      <FooterZen />
    </div>
  );
}

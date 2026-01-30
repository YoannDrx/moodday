import {
  NavbarMorph,
  Hero3D,
  FeatureCards3D,
  Timeline3D,
  Testimonials3D,
  Pricing3D,
  CtaAurora,
  FooterLayered,
} from "@/features/landing-variants/landing-5";

export default function Landing5Page() {
  return (
    <div className="min-h-screen">
      <NavbarMorph />
      <main>
        <Hero3D />
        <FeatureCards3D />
        <Timeline3D />
        <Testimonials3D />
        <Pricing3D />
        <CtaAurora />
      </main>
      <FooterLayered />
    </div>
  );
}

import {
  NavbarMegamenu,
  HeroCompact,
  BentoGrid,
  PricingBento,
  FaqBento,
  CtaBento,
  FooterRich,
} from "@/features/landing-variants/landing-4";

export default function Landing4Page() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <NavbarMegamenu />
      <main>
        <HeroCompact />
        <BentoGrid />
        <PricingBento />
        <FaqBento />
        <CtaBento />
      </main>
      <FooterRich />
    </div>
  );
}

import {
  NavbarMinimal,
  HeroStorytelling,
  SectionMorning,
  SectionDay,
  SectionEvening,
  SectionResult,
  CtaStorytelling,
  FooterMinimal,
} from "@/features/landing-variants/landing-1";

export default function Landing1Page() {
  return (
    <div className="min-h-screen">
      <NavbarMinimal />
      <main>
        <HeroStorytelling />
        <SectionMorning />
        <SectionDay />
        <SectionEvening />
        <SectionResult />
        <CtaStorytelling />
      </main>
      <FooterMinimal />
    </div>
  );
}

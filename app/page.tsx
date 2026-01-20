import { EmailFormSection } from "@/features/email/email-form-section";
import { BentoGridSection } from "@/features/landing/bento-section";
import { CTASectionCard } from "@/features/landing/cta/cta-card-section";
import { CTAImageSection } from "@/features/landing/cta/cta-image-section";
import { CtaSection } from "@/features/landing/cta/cta-section";
import { FAQSection } from "@/features/landing/faq-section";
import { FeaturesSection } from "@/features/landing/feature-section";
import { Hero } from "@/features/landing/hero";
import { LandingHeader } from "@/features/landing/landing-header";
import { PainSection } from "@/features/landing/pain";
import { ReviewGrid } from "@/features/landing/review/review-grid";
import { ReviewSingle } from "@/features/landing/review/review-single";
import { ReviewTriple } from "@/features/landing/review/review-triple";
import { SectionDivider } from "@/features/landing/section-divider";
import { StatsSection } from "@/features/landing/stats-section";
import { Footer } from "@/features/layout/footer";
import { Pricing } from "@/features/plans/pricing-section";
import Image from "next/image";
import { getI18n } from "@/i18n/server";
import type { ReactNode } from "react";

type LandingReview = {
  image: string;
  name: string;
  review: string;
  role: string;
  compagnyImage?: string;
};

type LandingFeature = {
  badge: string;
  title: string;
  description: string;
};

type LandingFeatureWithComponent = LandingFeature & {
  component: ReactNode;
};

type LandingFaq = {
  question: string;
  answer: string;
};

export default async function HomePage() {
  const { tm } = await getI18n();
  const tripleReviews = tm<LandingReview[]>("landing.reviews.triple") ?? [];
  const singleReview = tm<LandingReview>("landing.reviews.single");
  const gridReviews = tm<LandingReview[]>("landing.reviews.grid") ?? [];
  const featureItems = tm<LandingFeature[]>("landing.features.items") ?? [];
  const faqItems = tm<LandingFaq[]>("landing.faq.items") ?? [];
  const featureComponents = [
    (item: LandingFeature) => (
      <Image
        src="/images/placeholder1.gif"
        alt={item.title}
        width={200}
        height={100}
        className="h-auto w-full object-cover"
        unoptimized
      />
    ),
    (item: LandingFeature) => (
      <Image
        src="/images/placeholder1.gif"
        alt={item.title}
        width={200}
        height={100}
        className="h-auto w-full object-cover"
      />
    ),
    (item: LandingFeature) => (
      <Image
        src="/images/placeholder1.gif"
        alt={item.title}
        width={200}
        height={100}
        className="h-auto w-full object-cover"
        unoptimized
      />
    ),
    (item: LandingFeature) => (
      <Image
        src="/images/placeholder1.gif"
        alt={item.title}
        width={200}
        height={100}
        className="h-auto w-full object-cover"
        unoptimized
      />
    ),
  ];
  const featuresWithComponents: LandingFeatureWithComponent[] =
    featureItems.map((item, index) => ({
      ...item,
      component: featureComponents[index](item),
    }));

  return (
    <div className="bg-background text-foreground relative flex h-fit flex-col">
      <div className="mt-16"></div>

      <LandingHeader />

      <Hero />

      <StatsSection />

      <BentoGridSection />

      <PainSection />

      <SectionDivider />

      <ReviewTriple reviews={tripleReviews.slice(0, 3)} />

      <SectionDivider />

      {singleReview && (
        <ReviewSingle
          image={singleReview.image}
          name={singleReview.name}
          review={singleReview.review}
          role={singleReview.role}
          compagnyImage={singleReview.compagnyImage}
        />
      )}

      <FeaturesSection features={featuresWithComponents} />

      <CTAImageSection />

      <CTASectionCard />

      <CtaSection />

      <Pricing />

      <FAQSection faq={faqItems} />

      <SectionDivider />

      <ReviewGrid reviews={gridReviews} />

      <EmailFormSection />

      <SectionDivider />

      <Footer />
    </div>
  );
}

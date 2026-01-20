import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("about.metaTitle", { app: SiteConfig.title }),
    description: t("about.metaDescription"),
    keywords: [
      "about",
      "testimonials",
      "content creation",
      "founder",
      "mission",
    ],
    openGraph: {
      title: t("about.metaTitle", { app: SiteConfig.title }),
      description: t("about.metaDescription"),
      url: `${SiteConfig.prodUrl}/about`,
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const { t, tm } = await getI18n();
  const reliabilityItems =
    tm<{ label: string; value: string; suffix?: string }[]>(
      "about.reliability.items",
    ) ?? [];

  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />
      {/* Hero Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <Typography
            variant="p"
            className="text-primary text-base/7 font-semibold"
          >
            {t("about.hero.kicker")}
          </Typography>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-5xl font-semibold tracking-tight sm:text-7xl"
          >
            {t("about.hero.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-8 text-lg font-medium text-pretty sm:text-xl/8"
          >
            {t("about.hero.description")}
          </Typography>
        </div>
      </SectionLayout>

      {/* Main Content */}
      <SectionLayout size="lg" variant="transparent">
        <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
          <div className="lg:pr-8">
            <Typography
              variant="h2"
              className="text-foreground text-2xl font-semibold tracking-tight text-pretty"
            >
              {t("about.commitment.title")}
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-6 text-base/7"
            >
              {t("about.commitment.paragraphOne")}
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-8 text-base/7"
            >
              {t("about.commitment.paragraphTwo")}
            </Typography>
          </div>
          <div className="pt-16 lg:row-span-2 lg:-mr-16 xl:mr-auto">
            <div className="-mx-8 grid grid-cols-2 gap-4 sm:-mx-16 sm:grid-cols-4 lg:mx-0 lg:grid-cols-2 xl:gap-8">
              <div className="outline-border aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1">
                <img
                  alt={t("about.gallery.altOne")}
                  src="https://codelynx.mlvcdn.com/images/2025-08-22/IMG_6608.jpeg"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 lg:-mt-40">
                <img
                  alt={t("about.gallery.altTwo")}
                  src="https://codelynx.mlvcdn.com/images/2025-08-22/IMG_7415.jpeg"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1">
                <img
                  alt={t("about.gallery.altThree")}
                  src="https://codelynx.mlvcdn.com/images/2025-08-22/IMG_9392.jpeg"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 lg:-mt-40">
                <img
                  alt={t("about.gallery.altFour")}
                  src="https://codelynx.mlvcdn.com/images/2025-08-22/IMG_9896 2.jpeg"
                  className="block size-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="max-lg:mt-16 lg:col-span-1">
            <Typography
              variant="p"
              className="text-muted-foreground text-base/7 font-semibold"
            >
              {t("about.reliability.title")}
            </Typography>
            <hr className="border-border mt-6 border-t" />
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {reliabilityItems.map((item, index) => (
                <div
                  key={item.label}
                  className={
                    index < 2
                      ? "border-border flex flex-col gap-y-2 border-b border-dotted pb-4"
                      : index === 2
                        ? "max-sm:border-border flex flex-col gap-y-2 max-sm:border-b max-sm:border-dotted max-sm:pb-4"
                        : "flex flex-col gap-y-2"
                  }
                >
                  <dt className="text-muted-foreground text-sm/6">
                    {item.label}
                  </dt>
                  <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                    <span>{item.value}</span>
                    {item.suffix ?? ""}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </SectionLayout>
    </div>
  );
}

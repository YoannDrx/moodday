import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { Briefcase, Heart, MapPin, Users } from "lucide-react";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("careers.metaTitle", { app: SiteConfig.title }),
    description: t("careers.metaDescription"),
    openGraph: {
      title: t("careers.metaTitle", { app: SiteConfig.title }),
      description: t("careers.metaDescription"),
      url: `${SiteConfig.prodUrl}/careers`,
      type: "website",
    },
  };
}

export default async function CareersPage() {
  const { t, tm } = await getI18n();

  const values =
    tm<{ title: string; description: string }[]>("careers.values.items") ?? [];

  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />

      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <Briefcase className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("careers.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("careers.description")}
          </Typography>
        </div>
      </SectionLayout>

      <SectionLayout size="lg" variant="transparent">
        <div className="mx-auto max-w-4xl">
          {/* Values */}
          <div className="mb-16">
            <Typography
              variant="h2"
              className="text-foreground mb-8 text-center text-2xl font-bold"
            >
              {t("careers.values.title")}
            </Typography>
            <div className="grid gap-6 sm:grid-cols-3">
              {values.map((value, idx) => {
                const icons = [Heart, Users, MapPin];
                const Icon = icons[idx % icons.length];
                return (
                  <div
                    key={value.title}
                    className="border-border bg-card rounded-2xl border p-6 text-center"
                  >
                    <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
                      <Icon className="text-primary size-6" />
                    </div>
                    <Typography
                      variant="h3"
                      className="text-foreground mb-2 font-semibold"
                    >
                      {value.title}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-muted-foreground text-sm"
                    >
                      {value.description}
                    </Typography>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open Positions */}
          <div className="border-border bg-card mb-12 rounded-2xl border p-8 text-center">
            <Typography
              variant="h2"
              className="text-foreground mb-2 text-2xl font-bold"
            >
              {t("careers.openPositions.title")}
            </Typography>
            <Typography variant="p" className="text-muted-foreground mb-6">
              {t("careers.openPositions.description")}
            </Typography>
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              {t("careers.openPositions.cta")}
            </Link>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}

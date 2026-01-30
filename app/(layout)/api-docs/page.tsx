import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { Code2, Lock, Zap } from "lucide-react";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("apiDocs.metaTitle", { app: SiteConfig.title }),
    description: t("apiDocs.metaDescription"),
    openGraph: {
      title: t("apiDocs.metaTitle", { app: SiteConfig.title }),
      description: t("apiDocs.metaDescription"),
      url: `${SiteConfig.prodUrl}/api-docs`,
      type: "website",
    },
  };
}

export default async function ApiDocsPage() {
  const { t } = await getI18n();

  const features = [
    {
      icon: Lock,
      titleKey: "apiDocs.features.auth.title",
      descriptionKey: "apiDocs.features.auth.description",
    },
    {
      icon: Zap,
      titleKey: "apiDocs.features.realtime.title",
      descriptionKey: "apiDocs.features.realtime.description",
    },
    {
      icon: Code2,
      titleKey: "apiDocs.features.export.title",
      descriptionKey: "apiDocs.features.export.description",
    },
  ];

  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />

      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <Code2 className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("apiDocs.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("apiDocs.description")}
          </Typography>
        </div>
      </SectionLayout>

      <SectionLayout size="lg" variant="transparent">
        <div className="mx-auto max-w-4xl">
          {/* Coming Soon Notice */}
          <div className="border-primary/30 bg-primary/5 mb-12 rounded-2xl border p-8 text-center">
            <Typography
              variant="h2"
              className="text-foreground mb-2 text-2xl font-bold"
            >
              {t("apiDocs.comingSoon.title")}
            </Typography>
            <Typography variant="p" className="text-muted-foreground mb-6">
              {t("apiDocs.comingSoon.description")}
            </Typography>
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              {t("apiDocs.comingSoon.cta")}
            </Link>
          </div>

          {/* Features Preview */}
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="border-border bg-card rounded-2xl border p-6 text-center"
                >
                  <div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
                    <Icon className="text-primary size-6" />
                  </div>
                  <Typography
                    variant="h3"
                    className="text-foreground mb-2 font-semibold"
                  >
                    {t(feature.titleKey)}
                  </Typography>
                  <Typography
                    variant="p"
                    className="text-muted-foreground text-sm"
                  >
                    {t(feature.descriptionKey)}
                  </Typography>
                </div>
              );
            })}
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}

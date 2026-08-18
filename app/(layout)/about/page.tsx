import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  Heart,
  Lock,
  Microscope,
  Shield,
  Sparkles,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("about.metaTitle", { app: SiteConfig.title }),
    description: t("about.metaDescription"),
    keywords: [
      "about",
      "mental health",
      "mood tracking",
      "psychiatry",
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
  const { t } = await getI18n();
  const values = [
    {
      icon: Heart,
      title: t("about.values.items.kindness.title"),
      description: t("about.values.items.kindness.description"),
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: Lock,
      title: t("about.values.items.privacy.title"),
      description: t("about.values.items.privacy.description"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Microscope,
      title: t("about.values.items.science.title"),
      description: t("about.values.items.science.description"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];
  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />

      {/* Hero Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <Sparkles className="size-8" />
          </div>
          <Typography
            variant="p"
            className="text-primary mb-2 text-sm font-semibold tracking-widest uppercase"
          >
            {t("about.hero.kicker")}
          </Typography>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {t("about.hero.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              {t("about.hero.titleHighlight")}
            </span>
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg"
          >
            {t("about.hero.description")}
          </Typography>
        </div>
      </SectionLayout>

      {/* Mission Section */}
      <SectionLayout size="lg" variant="transparent" className="pt-0 lg:pt-0">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Mission */}
            <div className="border-border bg-card rounded-2xl border p-8">
              <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-xl">
                <Target className="text-primary size-6" />
              </div>
              <Typography
                variant="h2"
                className="text-foreground mb-4 text-2xl font-bold"
              >
                {t("about.mission.title")}
              </Typography>
              <Typography variant="p" className="text-muted-foreground mb-4">
                {t("about.mission.paragraphOne")}
              </Typography>
              <Typography variant="p" className="text-muted-foreground">
                {t("about.mission.paragraphTwo")}
              </Typography>
            </div>

            {/* Vision */}
            <div className="border-border bg-card rounded-2xl border p-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Stethoscope className="size-6 text-purple-500" />
              </div>
              <Typography
                variant="h2"
                className="text-foreground mb-4 text-2xl font-bold"
              >
                {t("about.vision.title")}
              </Typography>
              <Typography variant="p" className="text-muted-foreground mb-4">
                {t("about.vision.paragraphOne")}
              </Typography>
              <Typography variant="p" className="text-muted-foreground">
                {t("about.vision.paragraphTwo")}
              </Typography>
            </div>
          </div>

          {/* Values */}
          <div className="mt-16">
            <Typography
              variant="h2"
              className="text-foreground mb-8 text-center text-2xl font-bold"
            >
              {t("about.values.title")}
            </Typography>
            <div className="grid gap-6 md:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div
                    key={value.title}
                    className="border-border bg-card rounded-2xl border p-6"
                  >
                    <div
                      className={`mb-4 flex size-12 items-center justify-center rounded-xl ${value.bg}`}
                    >
                      <Icon className={`size-6 ${value.color}`} />
                    </div>
                    <Typography
                      variant="h3"
                      className="text-foreground mb-2 text-lg font-bold"
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

          {/* Team Section */}
          <div className="mt-16">
            <div className="border-border bg-card rounded-2xl border p-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Users className="size-6 text-amber-500" />
              </div>
              <Typography
                variant="h2"
                className="text-foreground mb-4 text-2xl font-bold"
              >
                {t("about.team.title")}
              </Typography>
              <Typography
                variant="p"
                className="text-muted-foreground mx-auto mb-6 max-w-2xl"
              >
                {t("about.team.description")}
              </Typography>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/contact"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-semibold transition-colors"
                >
                  {t("about.team.contactCta")}
                </Link>
              </div>
            </div>
          </div>

          {/* Privacy Promise */}
          <div className="mt-16">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <Shield className="size-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <Typography
                    variant="h3"
                    className="mb-2 text-xl font-bold text-emerald-700 dark:text-emerald-400"
                  >
                    {t("about.privacyPromise.title")}
                  </Typography>
                  <Typography
                    variant="p"
                    className="text-emerald-700 dark:text-emerald-300"
                  >
                    {t("about.privacyPromise.description")}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}

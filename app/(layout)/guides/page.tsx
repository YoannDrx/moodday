import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  BookOpen,
  Brain,
  Heart,
  Pill,
  Shield,
  Sparkles,
  ArrowRight,
  Rocket,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("guides.metaTitle", { app: SiteConfig.title }),
    description: t("guides.metaDescription"),
    openGraph: {
      title: t("guides.metaTitle", { app: SiteConfig.title }),
      description: t("guides.metaDescription"),
      url: `${SiteConfig.prodUrl}/guides`,
      type: "website",
    },
  };
}

const guideCategories = [
  {
    title: "Démarrage",
    description: "Commencez à utiliser Moodday en quelques minutes",
    guides: [
      {
        icon: Rocket,
        titleKey: "guides.items.gettingStarted.title",
        descriptionKey: "guides.items.gettingStarted.description",
        href: "/docs",
        color: "from-[#1D7680] to-[#2BA09F]",
        bgColor: "bg-[#1D7680]/10",
      },
      {
        icon: Settings,
        title: "Configurer votre profil",
        description:
          "Personnalisez votre expérience avec vos préférences et objectifs",
        href: "/docs",
        color: "from-violet-500 to-purple-600",
        bgColor: "bg-violet-500/10",
      },
    ],
  },
  {
    title: "Fonctionnalités",
    description: "Maîtrisez toutes les fonctionnalités de l'application",
    guides: [
      {
        icon: Brain,
        title: "Suivi de l'humeur",
        description:
          "Apprenez à enregistrer et analyser vos variations d'humeur quotidiennes",
        href: "/docs",
        color: "from-amber-500 to-orange-600",
        bgColor: "bg-amber-500/10",
      },
      {
        icon: Pill,
        titleKey: "guides.items.medications.title",
        descriptionKey: "guides.items.medications.description",
        href: "/docs",
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: BarChart3,
        title: "Rapports et statistiques",
        description:
          "Générez des rapports PDF pour vos consultations médicales",
        href: "/docs",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-500/10",
      },
    ],
  },
  {
    title: "Partage et sécurité",
    description: "Partagez vos données en toute confiance",
    guides: [
      {
        icon: Heart,
        titleKey: "guides.items.caregivers.title",
        descriptionKey: "guides.items.caregivers.description",
        href: "/docs",
        color: "from-rose-500 to-rose-600",
        bgColor: "bg-rose-500/10",
      },
      {
        icon: Shield,
        titleKey: "guides.items.privacy.title",
        descriptionKey: "guides.items.privacy.description",
        href: "/legal/privacy",
        color: "from-gray-500 to-gray-600",
        bgColor: "bg-gray-500/10",
      },
    ],
  },
];

export default async function GuidesPage() {
  const { t } = await getI18n();

  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />

      {/* Hero Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <BookOpen className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("guides.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("guides.description")}
          </Typography>
        </div>
      </SectionLayout>

      {/* Guides by Category */}
      <SectionLayout size="lg" variant="transparent">
        <div className="mx-auto max-w-5xl space-y-12">
          {guideCategories.map((category) => (
            <div key={category.title}>
              {/* Category Header */}
              <div className="mb-6">
                <Typography
                  variant="h2"
                  className="text-foreground text-2xl font-bold"
                >
                  {category.title}
                </Typography>
                <Typography
                  variant="p"
                  className="text-muted-foreground mt-1 text-sm"
                >
                  {category.description}
                </Typography>
              </div>

              {/* Guides Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.guides.map((guide) => {
                  const Icon = guide.icon;
                  const title = guide.titleKey
                    ? t(guide.titleKey)
                    : guide.title;
                  const description = guide.descriptionKey
                    ? t(guide.descriptionKey)
                    : guide.description;

                  return (
                    <Link
                      key={title}
                      href={guide.href}
                      className="group border-border bg-card hover:border-primary/30 relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg"
                    >
                      {/* Colored background accent */}
                      <div
                        className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-70 ${guide.bgColor}`}
                      />

                      <div className="relative">
                        <div
                          className={`mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${guide.color} text-white shadow-lg transition-transform group-hover:scale-110`}
                        >
                          <Icon className="size-6" />
                        </div>
                        <Typography
                          variant="h3"
                          className="text-foreground mb-2 text-lg font-semibold"
                        >
                          {title}
                        </Typography>
                        <Typography
                          variant="p"
                          className="text-muted-foreground mb-4 text-sm"
                        >
                          {description}
                        </Typography>
                        <div className="text-primary flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                          Lire le guide
                          <ArrowRight className="size-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionLayout>

      {/* CTA Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl">
          <div className="border-border bg-card rounded-2xl border p-8 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
              <Sparkles className="text-primary size-6" />
            </div>
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              Vous ne trouvez pas ce que vous cherchez ?
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mb-4 text-sm"
            >
              Notre équipe est là pour vous aider à tirer le meilleur de Moodday
            </Typography>
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-semibold transition-colors"
            >
              Contactez-nous
            </Link>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}

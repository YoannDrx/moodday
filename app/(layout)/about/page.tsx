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

const values = [
  {
    icon: Heart,
    title: "Bienveillance",
    description:
      "Pas de jugement, pas de pression. Votre bien-être passe avant les statistiques. Nous avons éliminé les streaks et la gamification culpabilisante.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Lock,
    title: "Confidentialité",
    description:
      "Vos données de santé sont sacrées. Chiffrement de bout en bout, hébergement EU, zéro tracking. Nous ne vendons jamais vos données.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Microscope,
    title: "Rigueur scientifique",
    description:
      "Développé avec des psychiatres et basé sur les dernières recherches en santé mentale. Pas de promesses miracle, juste des outils validés.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

const stats = [
  { value: "5000+", label: "Utilisateurs actifs" },
  { value: "1M+", label: "Check-ins enregistrés" },
  { value: "99.9%", label: "Uptime garanti" },
  { value: "4.8/5", label: "Note App Store" },
];

export default async function AboutPage() {
  const _i18n = await getI18n();

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
            À propos de Moodday
          </Typography>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Améliorer le suivi de la{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              santé mentale
            </span>
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg"
          >
            Moodday est né d&apos;un constat simple : les outils de suivi de
            santé mentale existants sont souvent anxiogènes, culpabilisants ou
            peu respectueux de la vie privée. Nous voulons changer cela.
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
                Notre mission
              </Typography>
              <Typography variant="p" className="text-muted-foreground mb-4">
                Créer des outils de suivi de santé mentale qui respectent
                vraiment les utilisateurs. Des outils bienveillants, sans
                jugement, qui vous aident à mieux comprendre votre parcours sans
                vous culpabiliser.
              </Typography>
              <Typography variant="p" className="text-muted-foreground">
                Nous croyons que chacun mérite d&apos;avoir accès à des
                ressources pour prendre soin de sa santé mentale, dans le
                respect total de sa vie privée.
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
                Conçu avec des professionnels
              </Typography>
              <Typography variant="p" className="text-muted-foreground mb-4">
                Moodday a été développé en collaboration étroite avec des
                psychiatres et des patients. Chaque fonctionnalité a été pensée
                pour répondre à de vrais besoins cliniques.
              </Typography>
              <Typography variant="p" className="text-muted-foreground">
                Notre objectif : faciliter la communication entre patients et
                soignants, et aider les professionnels à avoir une vision plus
                complète du parcours de leurs patients.
              </Typography>
            </div>
          </div>

          {/* Values */}
          <div className="mt-16">
            <Typography
              variant="h2"
              className="text-foreground mb-8 text-center text-2xl font-bold"
            >
              Nos valeurs
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

          {/* Stats */}
          <div className="from-primary/5 to-primary/10 mt-16 rounded-2xl border border-emerald-500/20 bg-gradient-to-br p-8">
            <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <Typography
                    variant="h3"
                    className="text-primary text-4xl font-bold"
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="p"
                    className="text-muted-foreground mt-1"
                  >
                    {stat.label}
                  </Typography>
                </div>
              ))}
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
                Une équipe engagée
              </Typography>
              <Typography
                variant="p"
                className="text-muted-foreground mx-auto mb-6 max-w-2xl"
              >
                Derrière Moodday, une équipe passionnée qui croit profondément à
                l&apos;importance de la santé mentale. Développeurs, designers,
                professionnels de santé... tous unis par une même conviction :
                chacun mérite des outils bienveillants pour son bien-être.
              </Typography>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/careers"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-semibold transition-colors"
                >
                  Rejoindre l&apos;équipe
                </Link>
                <Link
                  href="/contact"
                  className="border-border text-foreground hover:bg-muted inline-flex items-center rounded-lg border px-6 py-3 font-semibold transition-colors"
                >
                  Nous contacter
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
                    Notre promesse de confidentialité
                  </Typography>
                  <Typography
                    variant="p"
                    className="text-emerald-700 dark:text-emerald-300"
                  >
                    Vos données de santé mentale sont chiffrées, stockées en
                    Europe, et ne seront jamais vendues à des tiers. Vous avez
                    le contrôle total : exportez ou supprimez vos données à tout
                    moment. C&apos;est notre engagement.
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

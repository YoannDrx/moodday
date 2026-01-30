import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  CheckCircle,
  Cookie,
  Lock,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("legal.cookies.metaTitle", { app: SiteConfig.title }),
    description: t("legal.cookies.metaDescription"),
    openGraph: {
      title: t("legal.cookies.metaTitle", { app: SiteConfig.title }),
      description: t("legal.cookies.metaDescription"),
      url: `${SiteConfig.prodUrl}/legal/cookies`,
      type: "website",
    },
  };
}

const cookieTypes = [
  {
    icon: Lock,
    name: "Cookies d'authentification",
    description:
      "Vous maintiennent connecté à votre compte de manière sécurisée",
    essential: true,
    examples: ["Session utilisateur", "Token de sécurité", "Remember me"],
  },
  {
    icon: ShieldCheck,
    name: "Cookies de sécurité",
    description: "Protègent contre la fraude et les accès non autorisés",
    essential: true,
    examples: ["Protection CSRF", "Détection de bot", "Rate limiting"],
  },
  {
    icon: Settings,
    name: "Cookies de préférences",
    description: "Mémorisent vos choix pour une meilleure expérience",
    essential: true,
    examples: [
      "Langue préférée",
      "Thème (clair/sombre)",
      "Préférences d'affichage",
    ],
  },
];

const notUsed = [
  { label: "Cookies publicitaires" },
  { label: "Cookies de tracking" },
  { label: "Cookies tiers" },
  { label: "Cookies de réseaux sociaux" },
];

export default async function CookiesPage() {
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
            <Cookie className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("legal.cookies.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("legal.cookies.description")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-4 text-sm"
          >
            {t("legal.cookies.lastUpdated")}
          </Typography>
        </div>
      </SectionLayout>

      <SectionLayout size="lg" variant="transparent">
        <div className="mx-auto max-w-4xl">
          {/* Introduction */}
          <div className="border-border bg-card mb-8 rounded-2xl border p-6">
            <Typography
              variant="h2"
              className="text-foreground mb-4 text-xl font-bold"
            >
              Qu&apos;est-ce qu&apos;un cookie ?
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              Les cookies sont de petits fichiers texte stockés sur votre
              appareil lorsque vous visitez un site web. Ils aident les sites à
              mémoriser vos préférences et à améliorer votre expérience. Chez
              Moodday, nous utilisons uniquement les cookies{" "}
              <span className="text-primary font-semibold">
                strictement nécessaires
              </span>{" "}
              au fonctionnement de l&apos;application.
            </Typography>
          </div>

          {/* What we DON'T use - Highlight */}
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
              <Typography
                variant="h2"
                className="text-lg font-bold text-emerald-700 dark:text-emerald-400"
              >
                Ce que nous n&apos;utilisons PAS
              </Typography>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {notUsed.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg bg-white/50 p-3 dark:bg-black/20"
                >
                  <XCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Typography
              variant="p"
              className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              Vos données de santé mentale sont privées et le restent. Nous ne
              partageons rien avec des annonceurs ou des trackers tiers.
            </Typography>
          </div>

          {/* Cookie Types */}
          <Typography
            variant="h2"
            className="text-foreground mb-6 text-xl font-bold"
          >
            Cookies que nous utilisons
          </Typography>

          <div className="space-y-4">
            {cookieTypes.map((cookie) => {
              const Icon = cookie.icon;
              return (
                <div
                  key={cookie.name}
                  className="border-border bg-card rounded-2xl border p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
                        <Icon className="text-primary size-6" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Typography
                            variant="h3"
                            className="text-foreground font-bold"
                          >
                            {cookie.name}
                          </Typography>
                          {cookie.essential && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Essentiel
                            </span>
                          )}
                        </div>
                        <Typography
                          variant="p"
                          className="text-muted-foreground"
                        >
                          {cookie.description}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 pl-16">
                    {cookie.examples.map((example) => (
                      <span
                        key={example}
                        className="bg-muted text-muted-foreground rounded-lg px-3 py-1 text-sm"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Managing Cookies */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-6">
            <Typography
              variant="h2"
              className="text-foreground mb-4 text-xl font-bold"
            >
              Gérer les cookies
            </Typography>
            <Typography variant="p" className="text-muted-foreground mb-4">
              Vous pouvez gérer les cookies via les paramètres de votre
              navigateur. Cependant, notez que la désactivation des cookies
              essentiels peut affecter le fonctionnement de Moodday
              (impossibilité de rester connecté, par exemple).
            </Typography>
            <div className="bg-muted/50 rounded-lg p-4">
              <Typography variant="p" className="text-muted-foreground text-sm">
                <strong>Comment faire :</strong> Allez dans les paramètres de
                votre navigateur &gt; Confidentialité &gt; Cookies et données de
                sites
              </Typography>
            </div>
          </div>

          {/* Contact */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-6 text-center">
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              Questions sur nos cookies ?
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              Contactez-nous :{" "}
              <a
                href="mailto:hello@moodday.app"
                className="text-primary hover:underline"
              >
                hello@moodday.app
              </a>
            </Typography>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}

import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  Database,
  Eye,
  FileText,
  Lock,
  Server,
  Shield,
  UserCheck,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("legal.privacy.metaTitle", { app: SiteConfig.title }),
    description: t("legal.privacy.metaDescription"),
  };
}

const sections = [
  {
    icon: Eye,
    title: "Données collectées",
    items: [
      {
        label: "Compte",
        value: "Email, nom (optionnel), mot de passe chiffré",
      },
      {
        label: "Suivi quotidien",
        value: "Humeurs, notes personnelles, qualité du sommeil",
      },
      {
        label: "Médicaments",
        value: "Noms, dosages, horaires de prises",
      },
      {
        label: "Thérapie",
        value: "Dates des séances, notes (optionnelles)",
      },
    ],
    highlight:
      "Nous ne collectons JAMAIS votre géolocalisation, vos contacts, vos messages, ni aucune donnée de vos autres applications.",
  },
  {
    icon: FileText,
    title: "Utilisation de vos données",
    items: [
      { label: "Service", value: "Fournir le suivi personnel" },
      { label: "Rapports", value: "Générer vos PDF pour consultations" },
      { label: "Partage", value: "Aidants autorisés uniquement" },
      { label: "Amélioration", value: "Données agrégées et anonymisées" },
    ],
    highlight: "Nous ne vendons JAMAIS vos données à des tiers.",
  },
  {
    icon: Lock,
    title: "Sécurité",
    items: [
      { label: "Chiffrement", value: "AES-256 au repos, TLS 1.3 en transit" },
      { label: "Hébergement", value: "Serveurs en Union Européenne" },
      { label: "Authentification", value: "2FA disponible" },
      { label: "Audits", value: "Tests de sécurité réguliers" },
    ],
  },
  {
    icon: UserCheck,
    title: "Vos droits RGPD",
    items: [
      { label: "Accès", value: "Consultez toutes vos données" },
      { label: "Rectification", value: "Modifiez vos informations" },
      { label: "Effacement", value: "Supprimez votre compte" },
      { label: "Portabilité", value: "Exportez en JSON" },
    ],
  },
];

export default async function PrivacyPage() {
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
            <Shield className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("legal.privacy.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            {t("legal.privacy.metaDescription")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-4 text-sm"
          >
            Dernière mise à jour : Janvier 2026
          </Typography>
        </div>
      </SectionLayout>

      {/* Introduction */}
      <SectionLayout size="lg" variant="transparent" className="pt-0 lg:pt-0">
        <div className="mx-auto max-w-4xl">
          <div className="from-primary/5 to-primary/10 mb-12 rounded-2xl border border-emerald-500/20 bg-gradient-to-br p-6 text-center">
            <Typography variant="p" className="text-foreground text-lg">
              Chez Moodday, la protection de vos données de santé est notre{" "}
              <span className="text-primary font-semibold">
                priorité absolue
              </span>
              . Vos informations sont chiffrées, stockées en Europe, et ne sont
              jamais partagées sans votre consentement.
            </Typography>
          </div>

          {/* Main Sections */}
          <div className="grid gap-8 md:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="border-border bg-card rounded-2xl border p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                      <Icon className="text-primary size-5" />
                    </div>
                    <Typography
                      variant="h3"
                      className="text-foreground text-lg font-bold"
                    >
                      {section.title}
                    </Typography>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={item.label}
                        className="bg-muted/50 flex items-start gap-3 rounded-lg p-3"
                      >
                        <span className="text-primary text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {section.highlight && (
                    <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <Typography
                        variant="p"
                        className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        {section.highlight}
                      </Typography>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Conservation & Cookies */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                  <Database className="text-primary size-5" />
                </div>
                <Typography
                  variant="h3"
                  className="text-foreground text-lg font-bold"
                >
                  Conservation des données
                </Typography>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" />
                  Compte actif : données conservées
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" />
                  Après suppression : effacées sous 30 jours
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" />
                  Sauvegardes : supprimées sous 90 jours
                </li>
              </ul>
            </div>

            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                  <Server className="text-primary size-5" />
                </div>
                <Typography
                  variant="h3"
                  className="text-foreground text-lg font-bold"
                >
                  Cookies
                </Typography>
              </div>
              <Typography variant="p" className="text-muted-foreground text-sm">
                Nous utilisons uniquement des cookies essentiels : session,
                authentification et préférences (langue, thème).
              </Typography>
              <Typography
                variant="p"
                className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                Aucun cookie publicitaire ou de tracking.
              </Typography>
            </div>
          </div>

          {/* Contact DPO */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-6 text-center">
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              Contact DPO
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              Pour toute question relative à vos données :{" "}
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

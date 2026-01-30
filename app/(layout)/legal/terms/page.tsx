import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Gavel,
  Scale,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("legal.terms.metaTitle", { app: SiteConfig.title }),
    description: t("legal.terms.metaDescription"),
  };
}

const sections = [
  {
    icon: BookOpen,
    title: "Nature du service",
    content:
      "Moodday est un outil de suivi personnel qui vous permet d'enregistrer vos humeurs quotidiennes, suivre vos traitements médicamenteux et générer des rapports pour vos consultations médicales.",
    highlight: {
      type: "warning" as const,
      text: "Moodday n'est pas un dispositif médical et ne fournit aucun avis médical, diagnostic ou traitement.",
    },
  },
  {
    icon: UserCheck,
    title: "Inscription et compte",
    items: [
      "Être âgé d'au moins 16 ans",
      "Fournir des informations exactes lors de l'inscription",
      "Maintenir la confidentialité de vos identifiants",
      "Être responsable de toute activité sous votre compte",
    ],
  },
  {
    icon: Shield,
    title: "Utilisation acceptable",
    items: [
      "Utiliser l'application uniquement pour votre suivi personnel",
      "Ne pas partager vos identifiants",
      "Ne pas tenter de contourner les mesures de sécurité",
      "Respecter les droits des autres utilisateurs",
    ],
  },
  {
    icon: Users,
    title: "Cercle d'aidants",
    content:
      "Si vous invitez un proche dans votre cercle d'aidants, vous restez maître des données que vous partagez. Vous pouvez révoquer cet accès à tout moment. L'aidant s'engage à respecter la confidentialité des informations partagées.",
  },
  {
    icon: FileText,
    title: "Propriété intellectuelle",
    content:
      "L'ensemble des contenus de l'application (textes, graphiques, logos, icônes) sont la propriété de Moodday SAS ou de ses concédants. Toute reproduction est interdite sans autorisation.",
  },
  {
    icon: Scale,
    title: "Limitation de responsabilité",
    items: [
      "Des décisions médicales prises sur la base des données de l'application",
      "Des interruptions temporaires du service",
      "Des pertes de données en cas de force majeure",
    ],
    highlight: {
      type: "info" as const,
      text: "L'application est fournie \"en l'état\" sans garantie d'adéquation à un usage médical particulier.",
    },
  },
  {
    icon: XCircle,
    title: "Résiliation",
    content:
      "Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Moodday peut suspendre votre compte en cas de violation des CGU.",
  },
  {
    icon: Gavel,
    title: "Droit applicable",
    content:
      "Les présentes CGU sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris.",
  },
];

export default async function TermsPage() {
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
            <FileText className="size-8" />
          </div>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {t("legal.terms.title")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-6 text-lg"
          >
            Conditions générales d&apos;utilisation de l&apos;application
            Moodday
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-4 text-sm"
          >
            Dernière mise à jour : Janvier 2026
          </Typography>
        </div>
      </SectionLayout>

      {/* Emergency Banner */}
      <SectionLayout size="lg" variant="transparent" className="pt-0 lg:pt-0">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <Typography
                  variant="h3"
                  className="mb-2 font-bold text-amber-700 dark:text-amber-400"
                >
                  En cas de détresse ou d&apos;urgence
                </Typography>
                <Typography
                  variant="p"
                  className="text-amber-700 dark:text-amber-300"
                >
                  Contactez immédiatement un professionnel de santé ou le{" "}
                  <span className="font-bold">3114</span> (numéro national de
                  prévention du suicide, gratuit et confidentiel 24h/24).
                </Typography>
              </div>
            </div>
          </div>

          {/* Main Sections */}
          <div className="space-y-6">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="border-border bg-card rounded-2xl border p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
                      {idx + 1}
                    </div>
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

                  {section.content && (
                    <Typography
                      variant="p"
                      className="text-muted-foreground ml-11"
                    >
                      {section.content}
                    </Typography>
                  )}

                  {section.items && (
                    <ul className="text-muted-foreground ml-11 space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.highlight && (
                    <div
                      className={`mt-4 ml-11 rounded-lg p-3 ${
                        section.highlight.type === "warning"
                          ? "border border-amber-500/30 bg-amber-500/10"
                          : "border border-blue-500/30 bg-blue-500/10"
                      }`}
                    >
                      <Typography
                        variant="p"
                        className={`text-sm font-medium ${
                          section.highlight.type === "warning"
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {section.highlight.text}
                      </Typography>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-6 text-center">
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              Questions sur nos CGU ?
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              Contactez notre équipe juridique :{" "}
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

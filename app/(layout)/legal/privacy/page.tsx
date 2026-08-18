import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import Link from "next/link";
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

export default async function PrivacyPage() {
  const { t, locale } = await getI18n();
  const isEnglish = locale === "en";
  const legalBasisRows = isEnglish
    ? [
        {
          purpose: "Account, authentication, journal and requested exports",
          data: "Account data and entries supplied by you",
          basis:
            "Contract performance (Article 6(1)(b)); explicit consent for health data (Article 9(2)(a))",
        },
        {
          purpose: "Caregiver sharing",
          data: "Only categories, permissions and periods selected by you",
          basis:
            "Consent (Article 6(1)(a)) and explicit consent where health data is involved (Article 9(2)(a))",
        },
        {
          purpose: "Optional AI insights",
          data: "Minimized metrics; journal note only after separate consent",
          basis:
            "Consent (Article 6(1)(a)) and explicit consent for health data (Article 9(2)(a))",
        },
        {
          purpose: "Security, abuse prevention and service operations",
          data: "Content-free technical events and pseudonymous references",
          basis:
            "Legitimate interests in securing the service (Article 6(1)(f)); legal obligations where applicable",
        },
        {
          purpose: "Moodday Plus billing and accounting",
          data: "Subscription identifiers and legally required billing records",
          basis:
            "Contract performance and legal obligations (Articles 6(1)(b) and 6(1)(c))",
        },
      ]
    : [
        {
          purpose: "Compte, authentification, journal et exports demandés",
          data: "Données de compte et saisies fournies par vous",
          basis:
            "Exécution du contrat (article 6.1.b) ; consentement explicite pour les données de santé (article 9.2.a)",
        },
        {
          purpose: "Partage avec un aidant",
          data: "Uniquement les catégories, permissions et périodes choisies",
          basis:
            "Consentement (article 6.1.a) et consentement explicite lorsque des données de santé sont concernées (article 9.2.a)",
        },
        {
          purpose: "Insights IA facultatifs",
          data: "Métriques minimisées ; note uniquement après accord séparé",
          basis:
            "Consentement (article 6.1.a) et consentement explicite pour les données de santé (article 9.2.a)",
        },
        {
          purpose: "Sécurité, prévention des abus et exploitation",
          data: "Événements techniques sans contenu et références pseudonymes",
          basis:
            "Intérêt légitime à sécuriser le service (article 6.1.f) ; obligations légales lorsqu’elles s’appliquent",
        },
        {
          purpose: "Facturation Moodday Plus et comptabilité",
          data: "Identifiants d’abonnement et pièces imposées par la loi",
          basis:
            "Exécution du contrat et obligations légales (articles 6.1.b et 6.1.c)",
        },
      ];
  const sections = [
    {
      icon: Eye,
      title: t("legal.privacy.sections.data.title"),
      items: [
        {
          label: t("legal.privacy.sections.data.items.account.label"),
          value: t("legal.privacy.sections.data.items.account.value"),
        },
        {
          label: t("legal.privacy.sections.data.items.daily.label"),
          value: t("legal.privacy.sections.data.items.daily.value"),
        },
        {
          label: t("legal.privacy.sections.data.items.medications.label"),
          value: t("legal.privacy.sections.data.items.medications.value"),
        },
        {
          label: t("legal.privacy.sections.data.items.therapy.label"),
          value: t("legal.privacy.sections.data.items.therapy.value"),
        },
      ],
      highlight: t("legal.privacy.sections.data.highlight"),
    },
    {
      icon: FileText,
      title: t("legal.privacy.sections.usage.title"),
      items: [
        {
          label: t("legal.privacy.sections.usage.items.service.label"),
          value: t("legal.privacy.sections.usage.items.service.value"),
        },
        {
          label: t("legal.privacy.sections.usage.items.reports.label"),
          value: t("legal.privacy.sections.usage.items.reports.value"),
        },
        {
          label: t("legal.privacy.sections.usage.items.sharing.label"),
          value: t("legal.privacy.sections.usage.items.sharing.value"),
        },
        {
          label: t("legal.privacy.sections.usage.items.improvement.label"),
          value: t("legal.privacy.sections.usage.items.improvement.value"),
        },
      ],
      highlight: t("legal.privacy.sections.usage.highlight"),
    },
    {
      icon: Lock,
      title: t("legal.privacy.sections.security.title"),
      items: [
        {
          label: t("legal.privacy.sections.security.items.encryption.label"),
          value: t("legal.privacy.sections.security.items.encryption.value"),
        },
        {
          label: t("legal.privacy.sections.security.items.hosting.label"),
          value: t("legal.privacy.sections.security.items.hosting.value"),
        },
        {
          label: t("legal.privacy.sections.security.items.auth.label"),
          value: t("legal.privacy.sections.security.items.auth.value"),
        },
        {
          label: t("legal.privacy.sections.security.items.audit.label"),
          value: t("legal.privacy.sections.security.items.audit.value"),
        },
      ],
    },
    {
      icon: UserCheck,
      title: t("legal.privacy.sections.rights.title"),
      items: [
        {
          label: t("legal.privacy.sections.rights.items.access.label"),
          value: t("legal.privacy.sections.rights.items.access.value"),
        },
        {
          label: t("legal.privacy.sections.rights.items.rectify.label"),
          value: t("legal.privacy.sections.rights.items.rectify.value"),
        },
        {
          label: t("legal.privacy.sections.rights.items.delete.label"),
          value: t("legal.privacy.sections.rights.items.delete.value"),
        },
        {
          label: t("legal.privacy.sections.rights.items.portability.label"),
          value: t("legal.privacy.sections.rights.items.portability.value"),
        },
      ],
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
            {t("legal.privacy.lastUpdated")}
          </Typography>
        </div>
      </SectionLayout>

      {/* Introduction */}
      <SectionLayout size="lg" variant="transparent" className="pt-0 lg:pt-0">
        <div className="mx-auto max-w-4xl">
          <div className="from-primary/5 to-primary/10 mb-12 rounded-2xl border border-emerald-500/20 bg-gradient-to-br p-6 text-center">
            <Typography variant="p" className="text-foreground text-lg">
              {t("legal.privacy.intro.prefix")}{" "}
              <span className="text-primary font-semibold">
                {t("legal.privacy.intro.highlight")}
              </span>
              {t("legal.privacy.intro.suffix")}
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-3 text-sm"
            >
              {t("legal.privacy.controller", {
                publisher: SiteConfig.company.name,
                legalForm: SiteConfig.company.legalForm,
                siren: SiteConfig.company.siren,
              })}
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

          <div className="border-border bg-card mt-8 rounded-2xl border p-6">
            <Typography variant="h2" className="text-xl font-bold">
              {isEnglish
                ? "Purposes and legal bases"
                : "Finalités et bases juridiques"}
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-2 text-sm"
            >
              {isEnglish
                ? "Health-data consent is requested separately from acceptance of the Terms and this policy. Optional AI and caregiver processing remain disabled until their own consent is recorded."
                : "Le consentement aux données de santé est demandé séparément de l’acceptation des CGU et de cette politique. Les traitements facultatifs IA et aidant restent désactivés tant que leur accord propre n’est pas enregistré."}
            </Typography>
            <div
              className="mt-5 overflow-x-auto"
              role="region"
              aria-label={
                isEnglish
                  ? "Purposes and legal bases table"
                  : "Tableau des finalités et bases juridiques"
              }
              tabIndex={0}
            >
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      {isEnglish ? "Purpose" : "Finalité"}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {isEnglish ? "Data" : "Données"}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {isEnglish ? "Legal basis" : "Base juridique"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {legalBasisRows.map((row) => (
                    <tr key={row.purpose} className="border-t align-top">
                      <th className="px-4 py-4 font-medium">{row.purpose}</th>
                      <td className="text-muted-foreground px-4 py-4">
                        {row.data}
                      </td>
                      <td className="text-muted-foreground px-4 py-4">
                        {row.basis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  {t("legal.privacy.retention.title")}
                </Typography>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" />
                  {t("legal.privacy.retention.items.active")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" />
                  {t("legal.privacy.retention.items.afterDeletion")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 rounded-full" />
                  {t("legal.privacy.retention.items.backups")}
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
                  {t("legal.privacy.cookies.title")}
                </Typography>
              </div>
              <Typography variant="p" className="text-muted-foreground text-sm">
                {t("legal.privacy.cookies.description")}
              </Typography>
              <Typography
                variant="p"
                className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                {t("legal.privacy.cookies.note")}
              </Typography>
            </div>
          </div>

          {/* Contact DPO */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-6 text-center">
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              {t("legal.privacy.contact.title")}
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-3 text-sm"
            >
              {isEnglish
                ? "You may request restriction, object where the legal basis allows it, withdraw any consent at any time, and lodge a complaint with the French data protection authority (CNIL). Withdrawing an optional consent disables only that feature. Withdrawing the health-data consent required for the journal stops the corresponding processing; you can exercise that choice through account deletion or by contacting us. Withdrawal does not affect processing performed before it."
                : "Vous pouvez demander la limitation, vous opposer lorsque la base juridique le permet, retirer tout consentement à tout moment et introduire une réclamation auprès de la CNIL. Le retrait d’un consentement facultatif désactive uniquement la fonctionnalité concernée. Le retrait du consentement aux données de santé nécessaire au journal arrête le traitement correspondant ; vous pouvez exercer ce choix par la suppression du compte ou en nous contactant. Le retrait ne remet pas en cause les traitements réalisés auparavant."}
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              {t("legal.privacy.contact.descriptionPrefix")}{" "}
              <a
                href="mailto:hello@moodday.app"
                className="text-primary underline underline-offset-2"
              >
                hello@moodday.app
              </a>
            </Typography>
            <Link
              href="/legal/subprocessors"
              className="text-primary mt-3 inline-block text-sm font-medium underline"
            >
              {locale === "fr"
                ? "Consulter la liste des sous-traitants et son historique"
                : "View the processor list and change history"}
            </Link>
          </div>
        </div>
      </SectionLayout>
    </div>
  );
}

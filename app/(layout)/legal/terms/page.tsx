import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  AlertTriangle,
  BookOpen,
  Building2,
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

export default async function TermsPage() {
  const { t } = await getI18n();
  const sections = [
    {
      icon: Building2,
      title: t("legal.terms.sections.publisher.title"),
      content: t("legal.terms.sections.publisher.content", {
        publisher: SiteConfig.company.name,
        legalForm: SiteConfig.company.legalForm,
        siren: SiteConfig.company.siren,
      }),
    },
    {
      icon: BookOpen,
      title: t("legal.terms.sections.service.title"),
      content: t("legal.terms.sections.service.content"),
      highlight: {
        type: "warning" as const,
        text: t("legal.terms.sections.service.highlight"),
      },
    },
    {
      icon: UserCheck,
      title: t("legal.terms.sections.account.title"),
      items: [
        t("legal.terms.sections.account.items.age"),
        t("legal.terms.sections.account.items.accurateInfo"),
        t("legal.terms.sections.account.items.credentials"),
        t("legal.terms.sections.account.items.responsibility"),
      ],
    },
    {
      icon: Shield,
      title: t("legal.terms.sections.acceptableUse.title"),
      items: [
        t("legal.terms.sections.acceptableUse.items.personalTracking"),
        t("legal.terms.sections.acceptableUse.items.noSharing"),
        t("legal.terms.sections.acceptableUse.items.noBypass"),
        t("legal.terms.sections.acceptableUse.items.respect"),
      ],
    },
    {
      icon: Users,
      title: t("legal.terms.sections.caregiver.title"),
      content: t("legal.terms.sections.caregiver.content"),
    },
    {
      icon: FileText,
      title: t("legal.terms.sections.ip.title"),
      content: t("legal.terms.sections.ip.content"),
    },
    {
      icon: Scale,
      title: t("legal.terms.sections.liability.title"),
      items: [
        t("legal.terms.sections.liability.items.decisions"),
        t("legal.terms.sections.liability.items.interruptions"),
        t("legal.terms.sections.liability.items.losses"),
      ],
      highlight: {
        type: "info" as const,
        text: t("legal.terms.sections.liability.highlight"),
      },
    },
    {
      icon: XCircle,
      title: t("legal.terms.sections.termination.title"),
      content: t("legal.terms.sections.termination.content"),
    },
    {
      icon: Gavel,
      title: t("legal.terms.sections.law.title"),
      content: t("legal.terms.sections.law.content"),
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
            {t("legal.terms.subtitle")}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-4 text-sm"
          >
            {t("legal.terms.lastUpdated")}
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
                  className="mb-2 font-bold text-amber-800 dark:text-amber-300"
                >
                  {t("legal.terms.emergency.title")}
                </Typography>
                <Typography
                  variant="p"
                  className="text-amber-800 dark:text-amber-200"
                >
                  {t("legal.terms.emergency.descriptionPrefix")}{" "}
                  <span className="font-bold">
                    {t("legal.terms.emergency.phone")}
                  </span>{" "}
                  {t("legal.terms.emergency.descriptionSuffix")}
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
              {t("legal.terms.contact.title")}
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              {t("legal.terms.contact.descriptionPrefix")}{" "}
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

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

export default async function CookiesPage() {
  const { t } = await getI18n();
  const cookieTypes = [
    {
      icon: Lock,
      name: t("legal.cookies.types.auth.name"),
      description: t("legal.cookies.types.auth.description"),
      essential: true,
      examples: t("legal.cookies.types.auth.examples").split("||"),
    },
    {
      icon: ShieldCheck,
      name: t("legal.cookies.types.security.name"),
      description: t("legal.cookies.types.security.description"),
      essential: true,
      examples: t("legal.cookies.types.security.examples").split("||"),
    },
    {
      icon: Settings,
      name: t("legal.cookies.types.preferences.name"),
      description: t("legal.cookies.types.preferences.description"),
      essential: true,
      examples: t("legal.cookies.types.preferences.examples").split("||"),
    },
  ];
  const notUsed = [
    { label: t("legal.cookies.notUsed.ads") },
    { label: t("legal.cookies.notUsed.tracking") },
    { label: t("legal.cookies.notUsed.thirdParty") },
    { label: t("legal.cookies.notUsed.social") },
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
            {t("legal.cookies.intro.title")}
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            {t("legal.cookies.intro.descriptionPrefix")}{" "}
            <span className="text-primary font-semibold">
              {t("legal.cookies.intro.descriptionHighlight")}
            </span>{" "}
            {t("legal.cookies.intro.descriptionSuffix")}
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
                {t("legal.cookies.notUsed.title")}
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
              {t("legal.cookies.notUsed.note")}
            </Typography>
          </div>

          {/* Cookie Types */}
          <Typography
            variant="h2"
            className="text-foreground mb-6 text-xl font-bold"
          >
            {t("legal.cookies.usedTitle")}
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
                              {t("legal.cookies.essentialBadge")}
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
              {t("legal.cookies.manage.title")}
            </Typography>
            <Typography variant="p" className="text-muted-foreground mb-4">
              {t("legal.cookies.manage.description")}
            </Typography>
            <div className="bg-muted/50 rounded-lg p-4">
              <Typography variant="p" className="text-muted-foreground text-sm">
                <strong>{t("legal.cookies.manage.howToLabel")}</strong>{" "}
                {t("legal.cookies.manage.howToSteps")}
              </Typography>
            </div>
          </div>

          {/* Contact */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-6 text-center">
            <Typography
              variant="h3"
              className="text-foreground mb-2 text-lg font-bold"
            >
              {t("legal.cookies.contact.title")}
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              {t("legal.cookies.contact.descriptionPrefix")}{" "}
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

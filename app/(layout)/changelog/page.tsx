import { Typography } from "@/components/nowts/typography";
import { getChangelogs } from "@/features/changelog/changelog-manager";
import { ChangelogTimeline } from "@/features/changelog/changelog-timeline";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import { FileQuestion } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("changelog.metaTitle", { app: SiteConfig.title }),
    description: t("changelog.metaDescription"),
    openGraph: {
      title: t("changelog.metaTitle", { app: SiteConfig.title }),
      description: t("changelog.metaDescription"),
      url: `${SiteConfig.prodUrl}/changelog`,
      type: "website",
    },
  };
}

export default async function ChangelogPage() {
  const { t, locale } = await getI18n();
  const changelogs = await getChangelogs(locale);

  if (changelogs.length === 0) {
    return (
      <div className="px-6 py-16">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {t("changelog.title")}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            {t("changelog.description")}
          </p>
        </header>

        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-xl border-2 border-dashed p-12">
          <FileQuestion className="text-muted-foreground mb-4 size-16" />
          <Typography variant="h3">{t("changelog.emptyTitle")}</Typography>
          <Typography variant="muted" className="mt-2">
            {t("changelog.emptyDescription")}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-16">
      <header className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {t("changelog.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          {t("changelog.description")}
        </p>
      </header>

      <ChangelogTimeline
        changelogs={changelogs}
        className="mx-auto max-w-2xl"
      />
    </div>
  );
}

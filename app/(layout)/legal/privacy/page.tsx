import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("legal.privacy.metaTitle", { app: SiteConfig.title }),
    description: t("legal.privacy.metaDescription"),
  };
}

export default async function page() {
  const { t } = await getI18n();
  const markdown = t("legal.privacy.content");

  return (
    <div>
      <div className="bg-card flex w-full items-center justify-center p-8 lg:p-12">
        <Typography variant="h1">{t("legal.privacy.title")}</Typography>
      </div>
      <Layout>
        <LayoutContent className="prose dark:prose-invert m-auto mb-8">
          <MDXRemote source={markdown} />
        </LayoutContent>
      </Layout>
    </div>
  );
}

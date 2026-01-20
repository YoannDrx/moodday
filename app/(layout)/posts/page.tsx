import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { PostCard } from "@/features/posts/post-card";
import { getPosts, getPostsTags } from "@/features/posts/post-manager";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { PageParams } from "@/types/next";
import { FileQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("posts.metaTitle", { app: SiteConfig.title }),
    description: t("posts.metaDescription"),
    keywords: ["posts"],
    openGraph: {
      title: t("posts.metaTitle", { app: SiteConfig.title }),
      description: t("posts.metaDescription"),
      url: SiteConfig.prodUrl,
      type: "website",
    },
  };
}

export default async function RoutePage(props: PageParams) {
  const { t, locale } = await getI18n();
  const tags = await getPostsTags(locale);
  const posts = await getPosts(undefined, locale);

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>{t("posts.title")}</LayoutTitle>
      </LayoutHeader>
      <LayoutContent className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={{
              pathname: `/posts/categories/${tag}`,
            }}
          >
            <Badge variant="outline">{tag}</Badge>
          </Link>
        ))}
      </LayoutContent>

      {posts.length === 0 ? (
        <LayoutContent className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center rounded-lg border-2 border-dashed p-4 lg:gap-6 lg:p-8">
            <FileQuestion />
            <Typography variant="h2">{t("posts.emptyTitle")}</Typography>
            <Link className={buttonVariants({ variant: "link" })} href="/posts">
              {t("posts.viewAll")}
            </Link>
          </div>
        </LayoutContent>
      ) : (
        <LayoutContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </LayoutContent>
      )}
    </Layout>
  );
}

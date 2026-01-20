import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ServerMdx } from "@/features/markdown/server-mdx";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { calculateReadingTime } from "@/features/posts/calculate-reading-time";
import type { PostParams } from "@/features/posts/post-manager";
import { getCurrentPost, getPosts } from "@/features/posts/post-manager";
import { defaultLocale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/format/date";
import { logger } from "@/lib/logger";
import { SiteConfig } from "@/site-config";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata(props: PostParams): Promise<Metadata> {
  const params = await props.params;
  const { locale } = await getI18n();
  const post = await getCurrentPost(params.slug, locale);

  if (!post) {
    notFound();
  }

  return {
    title: post.attributes.title,
    description: post.attributes.description,
    keywords: post.attributes.keywords,
    authors: {
      name: SiteConfig.team.name,
      url: SiteConfig.team.website,
    },
    openGraph: {
      title: post.attributes.title,
      description: post.attributes.description,
      url: `https://codeline.app/posts/${params.slug}`,
      type: "article",
    },
  };
}

export async function generateStaticParams() {
  const posts = await getPosts(undefined, defaultLocale);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function RoutePage(props: PostParams) {
  const { t, locale } = await getI18n();
  const params = await props.params;
  const post = await getCurrentPost(params.slug, locale);

  if (!post) {
    notFound();
  }

  if (
    post.attributes.status === "draft" &&
    process.env.VERCEL_ENV === "production"
  ) {
    logger.warn(`Post "${post.attributes.title}" is a draft`);
    notFound();
  }

  return (
    <Layout>
      <LayoutContent>
        <Link className={buttonVariants({ variant: "link" })} href="/posts">
          <ArrowLeft size={16} /> {t("posts.back")}
        </Link>
      </LayoutContent>
      <LayoutHeader
        style={{
          backgroundImage: `url(${post.attributes.coverUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="overflow-hidden rounded-lg"
      >
        <div className="flex w-full flex-col gap-2 bg-black/50 p-10 text-white backdrop-blur">
          {post.attributes.status === "draft" ? (
            <Badge className="w-fit" variant="secondary">
              {t("posts.draft")}
            </Badge>
          ) : null}
          <LayoutTitle className="drop-shadow-sm">
            {post.attributes.title}
          </LayoutTitle>
          <LayoutDescription className="drop-shadow-sm">
            {t("posts.publishedBy", {
              date: formatDate(new Date(post.attributes.date), locale),
            })}{" "}
            ·{" "}
            {t("posts.readingTime", {
              minutes: calculateReadingTime(post.content).toLocaleString(
                locale,
              ),
            })}{" "}
            · {t("posts.createdBy")}{" "}
            <Typography variant="link" as={Link} href={SiteConfig.team.website}>
              {SiteConfig.team.name}
            </Typography>
          </LayoutDescription>
        </div>
      </LayoutHeader>
      <Separator />
      <LayoutContent>
        <ServerMdx
          className="prose dark:prose-invert lg:prose-lg xl:prose-xl mb-8"
          source={post.content}
        />
      </LayoutContent>
    </Layout>
  );
}

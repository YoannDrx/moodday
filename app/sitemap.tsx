import { getPosts } from "@/features/posts/post-manager";
import { defaultLocale } from "@/i18n/config";
import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts(undefined, defaultLocale);
  const publicRoutes = [
    "",
    "/about",
    "/contact",
    "/guides",
    "/posts",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    "/legal/subprocessors",
  ];

  return [
    ...(publicRoutes.map((route) => ({
      url: `${SiteConfig.prodUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    })) satisfies MetadataRoute.Sitemap),
    ...posts.map(
      (post) =>
        ({
          url: `${SiteConfig.prodUrl}/posts/${post.slug}`,
          lastModified: new Date(post.attributes.date),
          changeFrequency: "monthly",
          priority: 0.6,
        }) as const,
    ),
  ];
}

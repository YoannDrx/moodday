import type { PageParams } from "@/types/next";
import { defaultLocale, type Locale } from "@/i18n/config";
import fm from "front-matter";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const postsDirectory = path.join(process.cwd(), "content/posts");

const resolvePostsDirectory = async (locale: Locale) => {
  const localizedDirectory = path.join(postsDirectory, locale);
  try {
    await fs.access(localizedDirectory);
    return localizedDirectory;
  } catch {
    return path.join(postsDirectory, defaultLocale);
  }
};

const readPostFile = async (locale: Locale, slug: string) => {
  const localizedPath = path.join(postsDirectory, locale, `${slug}.mdx`);
  try {
    return await fs.readFile(localizedPath, "utf8");
  } catch (error) {
    if (locale === defaultLocale) {
      throw error;
    }
  }

  const fallbackPath = path.join(postsDirectory, defaultLocale, `${slug}.mdx`);
  return fs.readFile(fallbackPath, "utf8");
};

const AttributeSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  status: z.enum(["draft", "published"]),
  coverUrl: z.string(),
  tags: z.array(z.string()).optional(),
  date: z.date(),
});

type PostAttributes = z.infer<typeof AttributeSchema> & {
  date: Date;
};

export type Post = {
  slug: string;
  attributes: PostAttributes;
  content: string;
};

export const getPosts = async (
  tags?: string[],
  locale: Locale = defaultLocale,
) => {
  const directory = await resolvePostsDirectory(locale);
  const fileNames = await fs.readdir(directory);
  const posts: Post[] = [];
  for await (const fileName of fileNames) {
    const fullPath = path.join(directory, fileName);
    const fileContents = await fs.readFile(fullPath, "utf8");

    const matter = fm(fileContents);

    const result = AttributeSchema.safeParse(matter.attributes);

    if (!result.success) {
      continue;
    }

    if (
      process.env.VERCEL_ENV === "production" &&
      result.data.status === "draft"
    ) {
      continue;
    }

    if (tags) {
      if (!result.data.tags?.some((tag) => tags.includes(tag))) {
        continue;
      }
    }

    posts.push({
      slug: fileName.replace(".mdx", ""),
      content: matter.body,
      attributes: {
        ...result.data,
      },
    });
  }

  return posts;
};

export const getPostsTags = async (locale: Locale = defaultLocale) => {
  const posts = await getPosts(undefined, locale);
  const tags = new Set<string>();
  for (const post of posts) {
    if (!post.attributes.tags) {
      continue;
    }
    for (const tag of post.attributes.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags);
};

export type PostParams = PageParams<{ slug: string }>;

export const getCurrentPost = async (
  slug: string,
  locale: Locale = defaultLocale,
) => {
  try {
    const fileContents = await readPostFile(locale, slug);
    const matter = fm(fileContents);
    const result = AttributeSchema.safeParse(matter.attributes);

    if (!result.success) {
      return undefined;
    }

    if (
      process.env.VERCEL_ENV === "production" &&
      result.data.status === "draft"
    ) {
      return undefined;
    }

    return {
      slug,
      content: matter.body,
      attributes: {
        ...result.data,
      },
    } satisfies Post;
  } catch {
    return undefined;
  }
};

import { logger } from "@/lib/logger";
import { defaultLocale, type Locale } from "@/i18n/config";
import type { PageProps } from "@/types/next";
import fm from "front-matter";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const docsDirectory = path.join(process.cwd(), "content/docs");

const resolveDocsDirectory = async (locale: Locale) => {
  const localizedDirectory = path.join(docsDirectory, locale);
  try {
    await fs.access(localizedDirectory);
    return localizedDirectory;
  } catch {
    return path.join(docsDirectory, defaultLocale);
  }
};

const readDocFile = async (locale: Locale, slug: string) => {
  const localizedPath = path.join(docsDirectory, locale, `${slug}.mdx`);
  try {
    return await fs.readFile(localizedPath, "utf8");
  } catch (error) {
    if (locale === defaultLocale) {
      throw error;
    }
  }

  const fallbackPath = path.join(docsDirectory, defaultLocale, `${slug}.mdx`);
  return fs.readFile(fallbackPath, "utf8");
};

const AttributeSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  coverUrl: z.string().optional(),
  order: z.number().optional(),
  subcategory: z.string().optional(),
  method: z.string().optional(),
  endpoint: z.string().optional(),
  examples: z.record(z.string(), z.string()).optional(),
  results: z.record(z.string(), z.string()).optional(),
});

type DocAttributes = z.infer<typeof AttributeSchema>;

export type DocType = {
  slug: string;
  attributes: DocAttributes;
  content: string;
};

export type DocParams = PageProps<"/docs/[slug]">;

export async function getDocs(tags?: string[], locale: Locale = defaultLocale) {
  try {
    const directory = await resolveDocsDirectory(locale);
    const fileNames = await fs.readdir(directory);
    const docs: DocType[] = [];

    for await (const fileName of fileNames) {
      if (!fileName.endsWith(".mdx")) continue;

      const fullPath = path.join(directory, fileName);
      const fileContents = await fs.readFile(fullPath, "utf8");

      const matter = fm(fileContents);

      const result = AttributeSchema.safeParse(matter.attributes);

      if (!result.success) {
        logger.error(`Invalid frontmatter in ${fileName}:`, result.error);
        continue;
      }

      if (tags) {
        if (!result.data.tags?.some((tag) => tags.includes(tag))) {
          continue;
        }
      }

      docs.push({
        slug: fileName.replace(".mdx", ""),
        content: matter.body,
        attributes: result.data,
      });
    }

    return docs;
  } catch (error) {
    logger.error("Error getting docs:", error);
    return [];
  }
}

export async function getCurrentDoc(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<DocType | null> {
  try {
    const fileContents = await readDocFile(locale, slug);

    const matter = fm(fileContents);
    const result = AttributeSchema.safeParse(matter.attributes);

    if (!result.success) {
      logger.error(`Invalid frontmatter in ${slug}.mdx:`, result.error);
      return null;
    }

    return {
      slug,
      content: matter.body,
      attributes: result.data,
    };
  } catch (error) {
    logger.error(`Error getting doc ${slug}:`, error);
    return null;
  }
}

import { defaultLocale, type Locale } from "@/i18n/config";
import fm from "front-matter";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const changelogDirectory = path.join(process.cwd(), "content/changelog");

const resolveChangelogDirectory = async (locale: Locale) => {
  const localizedDirectory = path.join(changelogDirectory, locale);
  try {
    await fs.access(localizedDirectory);
    return localizedDirectory;
  } catch {
    return path.join(changelogDirectory, defaultLocale);
  }
};

const readChangelogFile = async (locale: Locale, slug: string) => {
  const localizedPath = path.join(changelogDirectory, locale, `${slug}.mdx`);
  try {
    return await fs.readFile(localizedPath, "utf8");
  } catch (error) {
    if (locale === defaultLocale) {
      throw error;
    }
  }

  const fallbackPath = path.join(
    changelogDirectory,
    defaultLocale,
    `${slug}.mdx`,
  );
  return fs.readFile(fallbackPath, "utf8");
};

const AttributeSchema = z.object({
  date: z.coerce.date(),
  version: z.string().optional(),
  title: z.string().optional(),
  image: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

type ChangelogAttributes = z.infer<typeof AttributeSchema>;

export type Changelog = {
  slug: string;
  attributes: ChangelogAttributes;
  content: string;
};

export const getChangelogs = async (
  locale: Locale = defaultLocale,
): Promise<Changelog[]> => {
  try {
    const directory = await resolveChangelogDirectory(locale);
    const fileNames = await fs.readdir(directory);
    const mdxFiles = fileNames.filter((f) => f.endsWith(".mdx"));

    const changelogPromises = mdxFiles.map(async (fileName) => {
      const fullPath = path.join(directory, fileName);
      const fileContents = await fs.readFile(fullPath, "utf8");

      const matter = fm(fileContents);
      const result = AttributeSchema.safeParse(matter.attributes);

      if (!result.success) {
        return null;
      }

      if (
        process.env.VERCEL_ENV === "production" &&
        result.data.status === "draft"
      ) {
        return null;
      }

      return {
        slug: fileName.replace(".mdx", ""),
        content: matter.body,
        attributes: result.data,
      } satisfies Changelog;
    });

    const results = await Promise.all(changelogPromises);
    const changelogs = results.filter((c): c is Changelog => c !== null);

    return changelogs.sort(
      (a, b) =>
        new Date(b.attributes.date).getTime() -
        new Date(a.attributes.date).getTime(),
    );
  } catch {
    return [];
  }
};

export type ChangelogParams = {
  params: Promise<{ slug: string }>;
};

export const getCurrentChangelog = async (
  slug: string,
  locale: Locale = defaultLocale,
): Promise<Changelog | undefined> => {
  try {
    const fileContents = await readChangelogFile(locale, slug);
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
      attributes: result.data,
    };
  } catch {
    return undefined;
  }
};

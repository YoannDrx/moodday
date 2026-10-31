import "server-only";

import { allyLessons, isAllyLessonSlug } from "@moodday/domain";
import fm from "front-matter";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const LessonAttributes = z.object({
  title: z.string(),
  day: z.number().int(),
  review: z.string(),
  tryThis: z.string(),
  quizQuestion: z.string(),
  quizOptions: z.array(z.string()).min(2),
  quizAnswer: z.number().int().min(0),
});

export type AllyLesson = z.infer<typeof LessonAttributes> & {
  slug: string;
  body: string;
};

export const readAllyLesson = async (
  slug: string,
): Promise<AllyLesson | null> => {
  if (!isAllyLessonSlug(slug)) return null;
  const file = await fs.readFile(
    path.join(process.cwd(), "content", "ally", `${slug}.mdx`),
    "utf8",
  );
  const parsed = fm<unknown>(file);
  return {
    ...LessonAttributes.parse(parsed.attributes),
    slug,
    body: parsed.body,
  };
};

export const neighbourLessons = (slug: string) => {
  const index = allyLessons.findIndex((lesson) => lesson.slug === slug);
  return {
    previous: index > 0 ? allyLessons[index - 1] : null,
    next:
      index >= 0 && index < allyLessons.length - 1
        ? allyLessons[index + 1]
        : null,
  };
};

import "server-only";

import { prisma } from "@/lib/prisma";
import { allyLessons, isAllyLessonSlug, nextAllyLesson } from "@moodday/domain";
import { CoupleError } from "./shared";

export const listCompletedLessons = async (userId: string) =>
  (
    await prisma.allyProgress.findMany({
      where: { userId },
      select: { lessonSlug: true },
    })
  ).map((progress) => progress.lessonSlug);

export const getAllyProgress = async (userId: string) => {
  const completed = await listCompletedLessons(userId);
  return {
    completed,
    total: allyLessons.length,
    next: nextAllyLesson(completed),
  };
};

export const completeLesson = async (userId: string, slug: string) => {
  if (!isAllyLessonSlug(slug)) {
    throw new CoupleError("unknown_lesson", "Cette leçon n'existe pas.");
  }
  await prisma.allyProgress.upsert({
    where: { userId_lessonSlug: { userId, lessonSlug: slug } },
    create: { userId, lessonSlug: slug },
    update: {},
  });
};

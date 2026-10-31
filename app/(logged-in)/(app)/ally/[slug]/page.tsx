import {
  neighbourLessons,
  readAllyLesson,
} from "@/features/couple/ally-content";
import { listCompletedLessons } from "@/features/couple/ally.service";
import { LessonQuiz } from "@/features/couple/ui/lesson-quiz";
import { ServerMdx } from "@/features/markdown/server-mdx";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const lesson = await readAllyLesson((await props.params).slug);
  return {
    title: lesson ? `Jour ${lesson.day} · ${lesson.title}` : "Programme Allié",
  };
}

export default async function AllyLessonPage(props: Props) {
  const { slug } = await props.params;
  const user = await getRequiredUser();
  const lesson = await readAllyLesson(slug);
  if (!lesson) notFound();
  const completed = await listCompletedLessons(user.id);
  const { next } = neighbourLessons(slug);

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/ally"
        className="w-fit text-sm font-bold underline underline-offset-4"
      >
        ← Programme Allié
      </Link>
      <header>
        <p className="text-sm font-bold uppercase">
          Jour {lesson.day}/7 · 2 minutes
        </p>
        <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">
          {lesson.title}
        </h1>
      </header>
      <div className="sticker p-6">
        <ServerMdx source={lesson.body} className="typography max-w-none" />
      </div>
      <aside className="sticker bg-mint-soft flex gap-3 p-5">
        <Lightbulb className="size-6 shrink-0" aria-hidden />
        <p>
          <strong>Essaie ça cette semaine :</strong> {lesson.tryThis}
        </p>
      </aside>
      <LessonQuiz
        slug={slug}
        question={lesson.quizQuestion}
        options={lesson.quizOptions}
        answer={lesson.quizAnswer}
        completed={completed.includes(slug)}
        nextHref={next ? `/ally/${next.slug}` : "/ally"}
      />
      <p className="text-muted-foreground text-xs">
        Contenu éducatif, sans valeur de diagnostic ni de conseil médical.
      </p>
    </article>
  );
}

import { Bouyotte } from "@/components/brand/bouyotte";
import { getAllyProgress } from "@/features/couple/ally.service";
import { getUserContext } from "@/features/couple/shared";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { cn } from "@/lib/utils";
import { allyLessons } from "@moodday/domain";
import { ArrowRight, BookOpen, CheckCircle2, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Programme Allié" };

const guides = [
  {
    href: "/posts/syndrome-premenstruel",
    title: "Le syndrome prémenstruel, en clair",
    text: "Ce que c'est, ce que ça n'est pas, et ce qui peut aider.",
  },
  {
    href: "/posts/tdpm-trouble-dysphorique-premenstruel",
    title: "TDPM : quand c'est plus que le SPM",
    text: "Les signes à connaître et comment en parler à un ou une professionnelle.",
  },
  {
    href: "/posts/aider-sa-partenaire-pendant-le-spm",
    title: "Ce que ton duo apprend dans le Programme Allié",
    text: "Le guide que ton ou ta partenaire suit, pour parler le même langage.",
  },
];

export default async function AllyPage() {
  const user = await getRequiredUser();
  const [context, progress] = await Promise.all([
    getUserContext(user.id),
    getAllyProgress(user.id),
  ]);

  if (context.role === "cycle_owner") {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Pour moi</h1>
          <p className="text-muted-foreground mt-1 font-semibold">
            Des lectures courtes, sans injonction ni culpabilité.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="sticker sticker-hover flex flex-col gap-2 p-5"
            >
              <BookOpen className="size-6" aria-hidden />
              <h2 className="text-lg font-extrabold">{guide.title}</h2>
              <p className="text-muted-foreground text-sm">{guide.text}</p>
            </Link>
          ))}
        </div>
        <section className="sticker bg-plum-soft/40 flex flex-col gap-3 p-6">
          <h2 className="text-2xl font-extrabold">
            Si ton SPM est vraiment lourd
          </h2>
          <p>
            Si chaque mois les jours d'avant les règles bousculent ton travail,
            tes relations ou ton moral, parles-en à un ou une professionnelle de
            santé. Faire ton point chaque jour pendant deux cycles donne une
            trace claire à montrer en consultation.
          </p>
          <Link
            href="/crisis"
            className="text-crisis flex w-fit items-center gap-2 font-bold underline underline-offset-4"
          >
            <LifeBuoy className="size-5" aria-hidden /> Besoin d'aide maintenant
            : 3114, 24 h/24
          </Link>
        </section>
      </div>
    );
  }

  const done = progress.completed.length;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-4">
        <Bouyotte
          mood={done === allyLessons.length ? "happy" : "wink"}
          className="size-20"
        />
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Programme Allié
          </h1>
          <p className="text-muted-foreground mt-1 font-semibold">
            {done === allyLessons.length
              ? "Programme terminé. Tu fais désormais partie des gens qui savent."
              : `${done}/7 leçons · 2 minutes par jour`}
          </p>
        </div>
      </header>
      <div
        className="bg-card h-4 overflow-hidden rounded-full border-2 border-[var(--ink)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={7}
        aria-valuenow={done}
        aria-label="Progression du programme"
      >
        <div
          className="bg-honey h-full"
          style={{ width: `${(done / 7) * 100}%` }}
        />
      </div>
      <ol className="flex flex-col gap-3">
        {allyLessons.map((lesson) => {
          const completed = progress.completed.includes(lesson.slug);
          const isNext = progress.next?.slug === lesson.slug;
          return (
            <li key={lesson.slug}>
              <Link
                href={`/ally/${lesson.slug}`}
                className={cn(
                  "sticker sticker-hover flex items-center gap-4 p-4",
                  isNext && "bg-honey-soft",
                )}
              >
                <span className="font-display bg-card flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] text-lg font-extrabold">
                  {completed ? (
                    <CheckCircle2 className="size-6" aria-label="Terminée" />
                  ) : (
                    lesson.day
                  )}
                </span>
                <span className="flex-1 font-bold">{lesson.title}</span>
                {isNext && <span className="text-sm font-bold">À faire</span>}
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

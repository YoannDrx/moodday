// Ally programme: seven two-minute lessons for the supporting partner. The
// lesson bodies live in content/ally/*.mdx and are reviewed by a health
// professional before release; this list fixes their order.

export const allyLessons = [
  {
    slug: "jour-1-le-spm-sans-cliches",
    day: 1,
    title: "Le SPM, sans les clichés",
  },
  {
    slug: "jour-2-ce-qui-se-passe-dans-son-corps",
    day: 2,
    title: "Ce qui se passe dans son corps",
  },
  {
    slug: "jour-3-les-phrases-qui-blessent",
    day: 3,
    title: "Les phrases qui blessent (et quoi dire à la place)",
  },
  {
    slug: "jour-4-proposer-sans-prendre-en-charge",
    day: 4,
    title: "Proposer de l'aide sans tout prendre en charge",
  },
  {
    slug: "jour-5-ecouter-sans-reparer",
    day: 5,
    title: "Écouter sans vouloir réparer",
  },
  {
    slug: "jour-6-quand-ca-devient-serieux",
    day: 6,
    title: "Quand ça devient sérieux",
  },
  {
    slug: "jour-7-et-toi-dans-tout-ca",
    day: 7,
    title: "Et toi, dans tout ça ?",
  },
] as const;

export type AllyLessonSlug = (typeof allyLessons)[number]["slug"];

export const isAllyLessonSlug = (slug: string): slug is AllyLessonSlug =>
  allyLessons.some((lesson) => lesson.slug === slug);

/** The next lesson to take: the first one not completed yet. */
export const nextAllyLesson = (completed: readonly string[]) =>
  allyLessons.find((lesson) => !completed.includes(lesson.slug)) ?? null;

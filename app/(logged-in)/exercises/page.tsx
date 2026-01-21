import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { ExerciseList } from "./_components/exercise-list";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("exercise.list.title"),
    description: t("exercise.list.title"),
  };
});

export default async function ExercisesPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("exercise.list.title")}</h1>
      <ExerciseList />
    </div>
  );
}

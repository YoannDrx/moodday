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
  return <ExerciseList />;
}

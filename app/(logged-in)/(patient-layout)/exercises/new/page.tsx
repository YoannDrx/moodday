import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { AddExerciseForm } from "./_components/add-exercise-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("exercise.add.title"),
    description: t("exercise.add.title"),
  };
});

export default async function NewExercisePage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("exercise.add.title")}</h1>
      <AddExerciseForm />
    </div>
  );
}

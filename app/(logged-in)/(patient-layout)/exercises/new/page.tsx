import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { PageLayout } from "@/components/nowts/page-layout";
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
    <PageLayout
      title={t("exercise.add.title")}
      maxWidth="3xl"
      showBlobs={false}
    >
      <AddExerciseForm />
    </PageLayout>
  );
}

import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import Link from "next/link";

import { PageHeader } from "@/components/nowts/layout-components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodayMoodCard } from "@/features/dashboard/today-mood-card";
import { MoodHistoryList } from "./history/_components/mood-history-list";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("patient.nav.mood"),
    description: t("mood.history.title"),
  };
});

export default async function MoodPage() {
  const { t } = await getI18n();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title={t("patient.nav.mood")}
        description="Enregistre et suis ton humeur au quotidien"
      />

      {/* Today's Mood Card */}
      <div className="mb-8">
        <TodayMoodCard />
      </div>

      {/* History Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("mood.history.title")}</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/mood/history">Voir tout</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <MoodHistoryList limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}

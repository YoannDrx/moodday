import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";

export default async function PageLoading() {
  const { t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.profile.editTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

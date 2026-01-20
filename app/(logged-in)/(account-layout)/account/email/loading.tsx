import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";

export default async function PageLoading() {
  const { t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.email.title")}</CardTitle>
        <CardDescription>{t("account.email.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

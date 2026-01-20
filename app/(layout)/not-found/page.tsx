import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function NotFoundPage() {
  const { t } = await getI18n();

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive size-6" />
        </div>
        <CardTitle className="text-2xl">{t("error.notFound.title")}</CardTitle>
        <CardDescription>{t("error.notFound.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="mb-2 font-medium">
            {t("error.notFound.explainerTitle")}
          </p>
          <p className="text-muted-foreground">
            {t("error.notFound.explainerDescription")}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <Button asChild variant="default">
          <Link href="/">{t("error.notFound.cta")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

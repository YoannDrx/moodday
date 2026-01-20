import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import { Mail } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.verify.metaTitle", { app: SiteConfig.title }),
    description: t("auth.verify.metaDescription"),
  };
}

export default async function VerificationCard() {
  const { t } = await getI18n();

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <Mail className="text-primary size-6" />
        </div>
        <CardTitle className="text-2xl">{t("auth.verify.title")}</CardTitle>
        <CardDescription>{t("auth.verify.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="mb-2 font-medium">{t("auth.verify.checkInbox")}</p>
          <p className="text-muted-foreground">
            {t("auth.verify.instructions")}
          </p>
        </div>
        <div className="text-muted-foreground text-sm">
          <p>{t("auth.verify.spamHelp")}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-muted-foreground text-center text-xs">
          {t("auth.verify.support")}
        </p>
      </CardFooter>
    </Card>
  );
}

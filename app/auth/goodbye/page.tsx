import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.goodbye.metaTitle", { app: SiteConfig.title }),
    description: t("auth.goodbye.metaDescription"),
  };
}

export default async function GoodbyePage() {
  const { t } = await getI18n();

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader>
        <div className="flex justify-center">
          <Avatar className="size-16">
            <AvatarFallback>
              <CheckCircle />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardHeader className="text-center">
          {t("auth.goodbye.title")}
        </CardHeader>

        <CardDescription className="text-center">
          {t("auth.goodbye.description")}
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t pt-6">
        <div className="w-full space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            {t("auth.goodbye.detailOne")}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("auth.goodbye.detailTwo")}
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/signup">{t("auth.goodbye.cta")}</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

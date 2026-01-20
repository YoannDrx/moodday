import { Loader } from "@/components/nowts/loader";
import { Typography } from "@/components/nowts/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { getUser } from "@/lib/auth/auth-user";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignUpCredentialsForm } from "./sign-up-credentials-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.signUp.metaTitle", { app: SiteConfig.title }),
    description: t("auth.signUp.metaDescription"),
  };
}

export default async function AuthSignInPage() {
  const { t } = await getI18n();
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader className="flex flex-col items-center justify-center gap-1">
        <Avatar className="mb-4 rounded-sm">
          <AvatarImage src={SiteConfig.appIcon} alt={t("nav.logoAlt")} />
          <AvatarFallback>
            {SiteConfig.title.substring(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <CardTitle>
          {t("auth.signUp.title", { app: SiteConfig.title })}
        </CardTitle>
        <CardDescription>{t("auth.signUp.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Loader />}>
          <SignUpCredentialsForm />
        </Suspense>

        <Typography variant="muted" className="mt-4 text-xs">
          {t("auth.signUp.hasAccount")}{" "}
          <Typography variant="link" as={Link} href="/auth/signin">
            {t("auth.signUp.signIn")}
          </Typography>
        </Typography>
      </CardContent>
    </Card>
  );
}

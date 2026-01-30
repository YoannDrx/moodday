import { MooddayLogo } from "@/components/nowts/moodday-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { SocialProviders } from "@/lib/auth";
import { getUser } from "@/lib/auth/auth-user";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInProviders } from "./sign-in-providers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.signIn.metaTitle", { app: SiteConfig.title }),
    description: t("auth.signIn.metaDescription"),
  };
}

export default async function AuthSignInPage() {
  const { t } = await getI18n();
  const user = await getUser();

  if (user) {
    redirect("/app");
  }

  const providers = Object.keys(SocialProviders ?? {});

  return (
    <Card className="mx-auto h-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader className="flex flex-col items-center justify-center gap-2">
        <MooddayLogo size="lg" href={undefined} className="mb-2" />

        <CardDescription className="text-center">
          {t("auth.signIn.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-4">
        <SignInProviders providers={providers} />
      </CardContent>
    </Card>
  );
}

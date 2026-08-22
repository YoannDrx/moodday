import { Loader } from "@/components/nowts/loader";
import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { Typography } from "@/components/nowts/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { getUser } from "@/lib/auth/auth-user";
import { getSignupAccess } from "@/lib/auth/signup-access";
import { env } from "@/lib/env";
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
    redirect("/app");
  }

  const signupAccess = getSignupAccess();

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader className="flex flex-col items-center justify-center gap-1">
        <MooddayLogo size="lg" href={undefined} className="mb-4" />
        <CardTitle>
          {t("auth.signUp.title", { app: SiteConfig.title })}
        </CardTitle>
        <CardDescription>{t("auth.signUp.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {signupAccess.mode === "closed" ? (
          <div
            className="rounded-3xl border border-[#155c5a]/15 bg-[#eef4ef] p-5 text-center"
            role="status"
          >
            <p className="font-[family-name:var(--font-caption)] text-lg font-semibold text-[#143f3e]">
              {t("auth.signUp.closedTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#45615f]">
              {t("auth.signUp.closedDescription")}
            </p>
          </div>
        ) : (
          <>
            {signupAccess.mode === "invite" ? (
              <p className="mb-5 rounded-2xl bg-[#fff3e8] px-4 py-3 text-sm leading-6 text-[#68452e]">
                {t("auth.signUp.inviteDescription")}
              </p>
            ) : null}
            <Suspense fallback={<Loader />}>
              <SignUpCredentialsForm
                termsVersion={env.LEGAL_TERMS_VERSION}
                privacyVersion={env.LEGAL_PRIVACY_VERSION}
                healthDataConsentVersion={env.HEALTH_DATA_CONSENT_VERSION}
                launchCountry={env.LAUNCH_COUNTRY}
              />
            </Suspense>
          </>
        )}

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

"use client";

import { Divider } from "@/components/nowts/divider";
import { Typography } from "@/components/nowts/typography";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProviderButton } from "./provider-button";
import { PasskeySignInButton } from "./passkey-sign-in-button";
import { SignInCredentialsAndMagicLinkForm } from "./sign-in-credentials-and-magic-link-form";
import type { PublicSignupMode } from "@/lib/auth/signup-access";

const SUPPORTED_PROVIDERS = ["github", "google", "apple"] as const;

const PROVIDER_ERROR_KEYS: Record<string, string> = {
  access_denied: "accessDenied",
  signup_disabled: "signupClosed",
  signup_invite_required: "signupInviteRequired",
};

export const getProviderErrorKey = (error: string | null) =>
  error ? (PROVIDER_ERROR_KEYS[error] ?? "generic") : null;

export const SignInProviders = ({
  providers,
  callbackUrl,
  signupMode = "public",
}: {
  providers: string[];
  callbackUrl?: string;
  signupMode?: PublicSignupMode;
}) => {
  const searchParams = useSearchParams();
  const callbackUrlParams = searchParams.get("callbackUrl");
  const { t } = useI18n();
  const providerErrorKey = getProviderErrorKey(searchParams.get("error"));

  // Default to /dashboard if no callback URL is provided or if it's the landing page
  const rawCallbackUrl = callbackUrl ?? callbackUrlParams;
  const finalCallbackUrl =
    !rawCallbackUrl || rawCallbackUrl === "/" ? "/dashboard" : rawCallbackUrl;

  const activeProviders = SUPPORTED_PROVIDERS.filter((p) =>
    providers.includes(p),
  );
  const providerCount = activeProviders.length;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {providerErrorKey ? (
        <div role="alert" className="text-destructive text-sm">
          <p>{t(`auth.signIn.providerErrors.${providerErrorKey}`)}</p>
          {providerErrorKey === "signupClosed" ||
          providerErrorKey === "signupInviteRequired" ? (
            <Typography
              variant="link"
              as={Link}
              href="/#waitlist"
              className="mt-1 inline-block text-sm"
            >
              {t("auth.signIn.providerErrors.joinWaitlist")}
            </Typography>
          ) : null}
        </div>
      ) : null}
      <SignInCredentialsAndMagicLinkForm callbackUrl={finalCallbackUrl} />
      <Divider>{t("auth.signIn.or")}</Divider>
      <PasskeySignInButton callbackUrl={finalCallbackUrl} />

      {providerCount > 0 ? (
        <div
          className={cn("grid gap-2 lg:gap-4", {
            "grid-cols-1": providerCount !== 2,
            "grid-cols-1 sm:grid-cols-2": providerCount === 2,
          })}
        >
          {activeProviders.map((providerId) => (
            <ProviderButton
              key={providerId}
              providerId={providerId}
              callbackUrl={finalCallbackUrl}
            />
          ))}
        </div>
      ) : null}

      {signupMode === "closed" ? (
        <Typography variant="muted" className="text-xs">
          {t("auth.signIn.registrationClosed")}
        </Typography>
      ) : (
        <Typography variant="muted" className="text-xs">
          {t("auth.signIn.noAccount")}{" "}
          <Typography
            variant="link"
            as={Link}
            href={`/auth/signup?callbackUrl=${encodeURIComponent(finalCallbackUrl)}`}
          >
            {t("auth.signIn.signUp")}
          </Typography>
        </Typography>
      )}
    </div>
  );
};

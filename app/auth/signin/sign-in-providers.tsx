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
  const { t, locale } = useI18n();
  const providerError = searchParams.get("error");

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
      {providerError ? (
        <p role="alert" className="text-destructive text-sm">
          {providerError === "access_denied"
            ? locale === "fr"
              ? "Connexion annulée. Tu peux réessayer ou utiliser ton e-mail."
              : "Sign-in cancelled. Try again or use your email."
            : locale === "fr"
              ? "Le fournisseur n’a pas pu terminer la connexion. Réessaie ou utilise ton e-mail."
              : "The provider could not complete sign-in. Try again or use your email."}
        </p>
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

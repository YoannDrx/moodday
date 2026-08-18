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

const SUPPORTED_PROVIDERS = ["github", "google"] as const;

export const SignInProviders = ({
  providers,
  callbackUrl,
}: {
  providers: string[];
  callbackUrl?: string;
}) => {
  const searchParams = useSearchParams();
  const callbackUrlParams = searchParams.get("callbackUrl");
  const { t } = useI18n();

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
      <SignInCredentialsAndMagicLinkForm callbackUrl={finalCallbackUrl} />
      <Divider>{t("auth.signIn.or")}</Divider>
      <PasskeySignInButton callbackUrl={finalCallbackUrl} />

      {providerCount > 0 ? (
        <div
          className={cn("grid gap-2 lg:gap-4", {
            "grid-cols-1": providerCount === 1,
            "grid-cols-2": providerCount === 2,
            "grid-cols-3": providerCount >= 3,
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

      <Typography variant="muted" className="text-xs">
        {t("auth.signIn.noAccount")}{" "}
        <Typography
          variant="link"
          as={Link}
          href={`/auth/signup?callbackUrl=${finalCallbackUrl}`}
        >
          {t("auth.signIn.signUp")}
        </Typography>
      </Typography>
    </div>
  );
};

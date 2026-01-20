"use client";

import { Divider } from "@/components/nowts/divider";
import { Typography } from "@/components/nowts/typography";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProviderButton } from "./provider-button";
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

  callbackUrl ??= callbackUrlParams as string;

  const activeProviders = SUPPORTED_PROVIDERS.filter((p) =>
    providers.includes(p),
  );
  const providerCount = activeProviders.length;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <SignInCredentialsAndMagicLinkForm callbackUrl={callbackUrl} />
      {providerCount > 0 && <Divider>{t("auth.signIn.or")}</Divider>}

      <div
        className={cn("grid gap-2 lg:gap-4", {
          "grid-cols-1": providerCount === 1,
          "grid-cols-2": providerCount === 2,
          "grid-cols-3": providerCount >= 3,
        })}
      >
        {/* ℹ️ Add provider you want to support here */}
        {activeProviders.map((providerId) => (
          <ProviderButton
            key={providerId}
            providerId={providerId}
            callbackUrl={callbackUrl}
          />
        ))}
      </div>

      <Typography variant="muted" className="text-xs">
        {t("auth.signIn.noAccount")}{" "}
        <Typography
          variant="link"
          as={Link}
          href={`/auth/signup?callbackUrl=${callbackUrl}`}
        >
          {t("auth.signIn.signUp")}
        </Typography>
      </Typography>
    </div>
  );
};

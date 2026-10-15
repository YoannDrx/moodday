import { Logo } from "@/components/nowts/logo";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLastUsedProviderStore } from "./last-used-provider.store";

const ProviderData: Record<string, { icon: ReactNode; name: string }> = {
  github: {
    icon: <Logo name="github" size={16} />,
    name: "Github",
  },
  google: {
    icon: <Logo name="google" size={16} />,
    name: "Google",
  },
  apple: {
    icon: <Logo name="apple" size={16} />,
    name: "Apple",
  },
};

type ProviderButtonProps = {
  providerId: "github" | "google" | "apple";
  callbackUrl?: string;
};

export const ProviderButton = (props: ProviderButtonProps) => {
  const { t, locale } = useI18n();
  const { lastUsedProvider } = useLastUsedProviderStore();

  const signInMutation = useMutation({
    mutationFn: async () => {
      const query = new URLSearchParams({
        provider: props.providerId,
        callbackUrl: props.callbackUrl ?? "/dashboard",
      });
      const result = await authClient.signIn.social({
        provider: props.providerId,
        errorCallbackURL: getCallbackUrl(
          `/auth/signin?${new URLSearchParams({ callbackUrl: props.callbackUrl ?? "/dashboard" }).toString()}`,
        ),
        callbackURL: getCallbackUrl(
          `/auth/last-used-provider?${query.toString()}`,
        ),
      });
      if (result.error) throw new Error("social_sign_in_failed");
    },
  });

  const data = ProviderData[props.providerId];
  const isLastUsed = lastUsedProvider === props.providerId;

  return (
    <div className="relative w-full">
      {isLastUsed && (
        <Badge
          variant="secondary"
          className="absolute -top-2.5 -right-2.5 z-10"
        >
          {t("auth.signIn.lastUsed")}
        </Badge>
      )}
      <LoadingButton
        loading={signInMutation.isPending}
        className={cn("h-auto min-h-11 w-full whitespace-normal", {
          "border bg-white text-black hover:bg-white dark:border-neutral-700":
            data.name === "Google",
          "border bg-black text-white hover:bg-gray-950 dark:border-neutral-700":
            data.name === "Github" || data.name === "Apple",
        })}
        size="lg"
        onClick={() => {
          signInMutation.mutate();
        }}
      >
        {data.icon}
        <span className="ml-2">
          {t("auth.signIn.provider", { provider: data.name })}
        </span>
      </LoadingButton>
      {signInMutation.isError ? (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {locale === "fr"
            ? "Connexion impossible. Réessayez ou utilisez votre e-mail."
            : "Sign-in failed. Try again or use your email."}
        </p>
      ) : null}
    </div>
  );
};

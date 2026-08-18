"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { authClient } from "@/lib/auth-client";

export function PasskeySignInButton({ callbackUrl }: { callbackUrl: string }) {
  const { locale } = useI18n();
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    setPending(true);
    const result = await authClient.signIn.passkey();
    setPending(false);
    if (result.error) {
      toast.error(
        locale === "fr"
          ? "Connexion par passkey impossible"
          : "Unable to sign in with a passkey",
      );
      return;
    }

    window.location.href =
      window.location.origin + getCallbackUrl(callbackUrl);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() => void signIn()}
    >
      <KeyRound aria-hidden="true" />
      {locale === "fr" ? "Continuer avec une passkey" : "Continue with a passkey"}
    </Button>
  );
}

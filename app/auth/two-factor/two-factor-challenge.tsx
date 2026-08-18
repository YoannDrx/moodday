"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function TwoFactorChallenge() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [pending, setPending] = useState(false);

  const verify = async () => {
    setPending(true);
    const result = useRecoveryCode
      ? await authClient.twoFactor.verifyBackupCode({
          code: code.trim(),
          trustDevice: false,
        })
      : await authClient.twoFactor.verifyTotp({
          code: code.trim(),
          trustDevice: false,
        });
    setPending(false);

    if (result.error) {
      toast.error("Le code est invalide ou expiré.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Vérification en deux étapes</CardTitle>
        <CardDescription>
          {useRecoveryCode
            ? "Saisissez un code de récupération à usage unique."
            : "Saisissez le code à six chiffres de votre application d’authentification."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="two-factor-code">
            {useRecoveryCode ? "Code de récupération" : "Code TOTP"}
          </Label>
          <Input
            id="two-factor-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode={useRecoveryCode ? "text" : "numeric"}
            autoComplete="one-time-code"
            maxLength={useRecoveryCode ? 64 : 6}
          />
        </div>
        <Button
          className="w-full"
          disabled={pending || code.trim().length === 0}
          onClick={() => void verify()}
        >
          {pending ? "Vérification…" : "Continuer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setCode("");
            setUseRecoveryCode((current) => !current);
          }}
        >
          {useRecoveryCode
            ? "Utiliser l’application d’authentification"
            : "Utiliser un code de récupération"}
        </Button>
      </CardContent>
    </Card>
  );
}

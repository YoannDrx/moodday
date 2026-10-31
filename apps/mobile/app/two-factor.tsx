import { useRouter } from "expo-router";
import { useState } from "react";
import { Screen } from "../src/components/screen";
import { Button, Field, StatusText, Txt } from "../src/components/ui";
import { authClient } from "../src/lib/auth-client";
import { clearMobileSessionInvalidation } from "../src/lib/session-security";

export default function TwoFactorScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const verify = async () => {
    if (pending || !code.trim()) return;
    setPending(true);
    setError(undefined);
    try {
      const result = recovery
        ? await authClient.twoFactor.verifyBackupCode({
            code: code.trim(),
            trustDevice: false,
          })
        : await authClient.twoFactor.verifyTotp({
            code: code.trim(),
            trustDevice: false,
          });
      if (result.error) {
        setError(
          "Le code est invalide ou expiré. Réessaie, ou utilise un code de récupération.",
        );
        return;
      }
      clearMobileSessionInvalidation();
      router.replace("/");
    } catch {
      setError(
        "La vérification est indisponible. Vérifie ta connexion puis réessaie.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <Screen title="Une dernière vérification.">
      <Txt>
        {recovery
          ? "Saisis un code de récupération à usage unique."
          : "Saisis les six chiffres de ton application d’authentification."}
      </Txt>
      <Field
        label={recovery ? "Code de récupération" : "Code à six chiffres"}
        testID="two-factor-code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="one-time-code"
        keyboardType={recovery ? "default" : "number-pad"}
        maxLength={recovery ? 64 : 6}
        editable={!pending}
        style={{ fontSize: 20, letterSpacing: recovery ? 0 : 4 }}
      />
      <StatusText tone="danger">{error}</StatusText>
      <Button
        variant="honey"
        testID="two-factor-submit"
        label={pending ? "Vérification…" : "Continuer"}
        accessibilityLabel="Continuer"
        disabled={pending || (recovery ? !code.trim() : !/^\d{6}$/.test(code))}
        onPress={() => void verify()}
      />
      <Button
        variant="ghost"
        label={
          recovery
            ? "Utiliser l’application d’authentification"
            : "Utiliser un code de récupération"
        }
        disabled={pending}
        onPress={() => {
          setCode("");
          setError(undefined);
          setRecovery((current) => !current);
        }}
      />
      <Button
        variant="ghost"
        label="Revenir à la connexion"
        disabled={pending}
        onPress={() => router.replace("/sign-in")}
      />
    </Screen>
  );
}

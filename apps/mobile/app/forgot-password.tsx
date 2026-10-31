import { useRouter } from "expo-router";
import { useState } from "react";
import { Screen } from "../src/components/screen";
import { Button, Field, StatusText, Txt } from "../src/components/ui";
import { appBaseUrl } from "../src/lib/api";
import { authClient } from "../src/lib/auth-client";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const send = async () => {
    if (pending || !email.trim()) return;
    setPending(true);
    setMessage(undefined);
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${appBaseUrl}/auth/reset-password`,
      });
      setMessage(
        result.error
          ? "L’envoi est momentanément indisponible. Réessaie dans quelques instants."
          : "Si un compte correspond à cette adresse, tu recevras un lien pour choisir un nouveau mot de passe. Reviens ensuite te connecter dans l’application.",
      );
    } catch {
      setMessage(
        "Vérifie ta connexion puis réessaie. Ta demande n’a pas pu être confirmée.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <Screen title="Retrouve ton accès.">
      <Txt>
        Un lien envoyé par e-mail te permettra de choisir un nouveau mot de
        passe. Ça arrive aux meilleur·e·s.
      </Txt>
      <Field
        label="Adresse e-mail"
        testID="password-recovery-email"
        value={email}
        onChangeText={setEmail}
        editable={!pending}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <StatusText>{message}</StatusText>
      <Button
        variant="honey"
        label={pending ? "Envoi…" : "Recevoir un lien"}
        accessibilityLabel="Recevoir un lien"
        disabled={pending || !email.trim()}
        onPress={() => void send()}
      />
      <Button
        variant="ghost"
        label="Revenir à la connexion"
        onPress={() => router.replace("/sign-in")}
      />
    </Screen>
  );
}

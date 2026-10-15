import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { Screen } from "../src/components/screen";
import { authClient } from "../src/lib/auth-client";
import { appBaseUrl } from "../src/lib/api";

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
    <Screen>
      <Text style={styles.title}>Retrouve ton accès.</Text>
      <Text style={styles.text}>
        Un lien envoyé par e-mail te permettra de choisir un nouveau mot de
        passe.
      </Text>
      <TextInput
        accessibilityLabel="Adresse e-mail"
        testID="password-recovery-email"
        value={email}
        onChangeText={setEmail}
        editable={!pending}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={pending || !email.trim()}
        onPress={() => void send()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {pending ? "Envoi…" : "Recevoir un lien"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace("/sign-in")}
        style={styles.link}
      >
        <Text style={styles.text}>Revenir à la connexion</Text>
      </Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: color.ink },
  text: { fontSize: 16, lineHeight: 24, color: color.ink },
  input: {
    minHeight: 52,
    fontSize: 16,
    borderWidth: 1,
    borderColor: color.border,
    padding: space[3],
    borderRadius: radius.medium,
    color: color.ink,
  },
  button: {
    minHeight: 50,
    padding: space[4],
    backgroundColor: color.primary,
    borderRadius: radius.medium,
  },
  buttonText: { color: color.surfaceStrong, fontSize: 16, textAlign: "center" },
  link: { minHeight: 48, justifyContent: "center" },
});

import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { Screen } from "../src/components/screen";
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
    <Screen>
      <Text style={styles.title}>Une dernière vérification.</Text>
      <Text style={styles.text}>
        {recovery
          ? "Saisis un code de récupération à usage unique."
          : "Saisis les six chiffres de ton application d’authentification."}
      </Text>
      <TextInput
        accessibilityLabel={
          recovery ? "Code de récupération" : "Code à six chiffres"
        }
        testID="two-factor-code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="one-time-code"
        keyboardType={recovery ? "default" : "number-pad"}
        maxLength={recovery ? 64 : 6}
        editable={!pending}
        style={styles.input}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        testID="two-factor-submit"
        disabled={pending || (recovery ? !code.trim() : !/^\d{6}$/.test(code))}
        onPress={() => void verify()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {pending ? "Vérification…" : "Continuer"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={pending}
        onPress={() => {
          setCode("");
          setError(undefined);
          setRecovery((current) => !current);
        }}
        style={styles.link}
      >
        <Text style={styles.text}>
          {recovery
            ? "Utiliser l’application d’authentification"
            : "Utiliser un code de récupération"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={pending}
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
    fontSize: 20,
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
  error: { color: color.danger },
  link: { minHeight: 48, justifyContent: "center" },
});

import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandIllustration } from "../src/components/brand-illustration";
import { MoodDayMark } from "../src/components/moodday-mark";
import { authClient } from "../src/lib/auth-client";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  const signIn = async () => {
    setIsPending(true);
    setError(undefined);
    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    setIsPending(false);

    if (result.error) {
      setError("Connexion impossible. Vérifie tes informations puis réessaie.");
      return;
    }
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <View testID="sign-in-screen">
            <MoodDayMark />
          </View>
          <BrandIllustration variant="welcome" style={styles.illustration} />
          <Text style={styles.title}>Retrouve ton fil.</Text>
          <Text style={styles.subtitle}>
            Le même compte et les mêmes données que sur Mood Day web.
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Adresse e-mail</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                accessibilityLabel="Adresse e-mail"
                testID="sign-in-email"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                accessibilityLabel="Mot de passe"
                testID="sign-in-password"
              />
            </View>

            {error ? (
              <Text accessibilityLiveRegion="assertive" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Se connecter"
              disabled={!email.trim() || !password || isPending}
              onPress={() => void signIn()}
              style={({ pressed }) => [
                styles.button,
                (!email.trim() || !password || isPending) && styles.disabled,
                pressed && styles.pressed,
              ]}
              testID="sign-in-submit"
            >
              <Text style={styles.buttonLabel}>
                {isPending ? "Connexion…" : "Se connecter"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.help}>
            La création de compte et la récupération restent disponibles sur le
            web pendant cette première development build.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.canvas },
  keyboard: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: space[6] },
  illustration: {
    alignSelf: "center",
    width: 220,
    height: 132,
    marginTop: space[3],
    marginBottom: -space[3],
  },
  title: {
    marginTop: space[6],
    color: color.ink,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: space[3],
    color: color.inkMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    marginTop: space[8],
    gap: space[4],
    padding: space[5],
    borderRadius: radius.large,
    backgroundColor: color.surfaceStrong,
    borderWidth: 1,
    borderColor: color.border,
  },
  field: { gap: space[2] },
  label: { color: color.ink, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 48,
    paddingHorizontal: space[4],
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: color.border,
    color: color.ink,
    fontSize: 16,
  },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
  },
  buttonLabel: { color: color.surfaceStrong, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  error: { color: color.danger, fontSize: 14, lineHeight: 20 },
  help: {
    marginTop: space[5],
    color: color.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});

import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandIllustration } from "../src/components/brand-illustration";
import { MoodDayMark } from "../src/components/moodday-mark";
import { authClient } from "../src/lib/auth-client";
import { clearMobileSessionInvalidation } from "../src/lib/session-security";
import { appBaseUrl } from "../src/lib/api";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isApplePending, setIsApplePending] = useState(false);
  const [error, setError] = useState<string>();

  const authPending = isPending || isGooglePending || isApplePending;

  const signIn = async () => {
    if (authPending) return;
    setIsPending(true);
    setError(undefined);
    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(
          "Connexion impossible. Vérifie tes informations puis réessaie.",
        );
        return;
      }
      if ("twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
        router.push("/two-factor");
        return;
      }
      clearMobileSessionInvalidation();
      router.replace("/");
    } catch {
      setError(
        "Vérifie ta connexion puis réessaie. Tu peux reprendre sans perdre tes informations.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsGooglePending(true);
    setError(undefined);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (result.error) {
        setError(
          "Connexion Google interrompue. Tu peux réessayer ou utiliser ton e-mail.",
        );
        return;
      }

      clearMobileSessionInvalidation();
      router.replace("/");
    } catch {
      setError(
        "Google ne répond pas pour le moment. Vérifie ta connexion puis réessaie.",
      );
    } finally {
      setIsGooglePending(false);
    }
  };

  const signInWithApple = async () => {
    setIsApplePending(true);
    setError(undefined);

    try {
      const result = await authClient.signIn.social({
        provider: "apple",
        callbackURL: "/",
      });

      if (result.error) {
        setError(
          "Connexion Apple interrompue. Tu peux réessayer ou utiliser ton e-mail.",
        );
        return;
      }

      clearMobileSessionInvalidation();
      router.replace("/");
    } catch {
      setError(
        "Apple ne répond pas pour le moment. Vérifie ta connexion puis réessaie.",
      );
    } finally {
      setIsApplePending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View testID="sign-in-screen">
            <MoodDayMark />
          </View>
          <BrandIllustration variant="welcome" style={styles.illustration} />
          <Text style={styles.title}>Retrouve ton fil.</Text>
          <Text style={styles.subtitle}>
            Le même compte et les mêmes données que sur Mood Day web.
          </Text>

          <View style={styles.form}>
            {process.env.EXPO_PUBLIC_OAUTH_GOOGLE_ENABLED === "true" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continuer avec Google"
                disabled={authPending}
                onPress={() => void signInWithGoogle()}
                style={({ pressed }) => [
                  styles.googleButton,
                  authPending && styles.disabled,
                  pressed && styles.pressed,
                ]}
                testID="sign-in-google"
              >
                <Text accessibilityElementsHidden style={styles.googleMark}>
                  G
                </Text>
                <Text style={styles.googleButtonLabel}>
                  {isGooglePending
                    ? "Ouverture de Google…"
                    : "Continuer avec Google"}
                </Text>
              </Pressable>
            ) : null}

            {process.env.EXPO_PUBLIC_OAUTH_APPLE_ENABLED === "true" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continuer avec Apple"
                disabled={authPending}
                onPress={() => void signInWithApple()}
                style={({ pressed }) => [
                  styles.appleButton,
                  authPending && styles.disabled,
                  pressed && styles.pressed,
                ]}
                testID="sign-in-apple"
              >
                <Text accessibilityElementsHidden style={styles.appleMark}>
                  
                </Text>
                <Text style={styles.appleButtonLabel}>
                  {isApplePending
                    ? "Ouverture d’Apple…"
                    : "Continuer avec Apple"}
                </Text>
              </Pressable>
            ) : null}

            <View accessibilityElementsHidden style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>ou avec ton e-mail</Text>
              <View style={styles.divider} />
            </View>

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
              disabled={!email.trim() || !password || authPending}
              onPress={() => void signIn()}
              style={({ pressed }) => [
                styles.button,
                (!email.trim() || !password || authPending) && styles.disabled,
                pressed && styles.pressed,
              ]}
              testID="sign-in-submit"
            >
              <Text style={styles.buttonLabel}>
                {isPending ? "Connexion…" : "Se connecter"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.helpLink}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.help}>Mot de passe oublié ?</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            style={styles.helpLink}
            onPress={() => {
              void Linking.openURL(`${appBaseUrl}/auth/signup`).catch(() =>
                setError(
                  "Impossible d’ouvrir la création de compte pour le moment.",
                ),
              );
            }}
          >
            <Text style={styles.help}>
              Créer mon compte par e-mail sur le web
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.canvas },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: space[6] },
  helpLink: { minHeight: 48, justifyContent: "center" },
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
  googleButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.canvas,
  },
  googleMark: {
    color: color.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  googleButtonLabel: { color: color.ink, fontSize: 16, fontWeight: "700" },
  appleButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.ink,
  },
  appleMark: {
    color: color.surfaceStrong,
    fontSize: 21,
    lineHeight: 23,
  },
  appleButtonLabel: {
    color: color.surfaceStrong,
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  divider: { flex: 1, height: 1, backgroundColor: color.border },
  dividerLabel: { color: color.inkMuted, fontSize: 12 },
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

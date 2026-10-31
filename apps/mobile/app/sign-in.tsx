import { space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Bouyotte } from "../src/components/bouyotte";
import { Screen } from "../src/components/screen";
import { Button, Field, StatusText, Sticker, Txt } from "../src/components/ui";
import { appBaseUrl } from "../src/lib/api";
import { authClient } from "../src/lib/auth-client";
import { clearMobileSessionInvalidation } from "../src/lib/session-security";
import { usePalette } from "../src/lib/theme";

export default function SignInScreen() {
  const router = useRouter();
  const palette = usePalette();
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
    <Screen>
      <View testID="sign-in-screen" style={styles.hero}>
        <Bouyotte mood="happy" steam size={120} />
        <Txt variant="eyebrow" tone="muted">
          Moodday
        </Txt>
        <Txt variant="display" accessibilityRole="header" style={styles.center}>
          Le SPM, ça se vit mieux à deux.
        </Txt>
        <Txt tone="muted" style={styles.center}>
          Le même compte et le même duo que sur Moodday web.
        </Txt>
      </View>

      <Sticker>
        {process.env.EXPO_PUBLIC_OAUTH_APPLE_ENABLED === "true" ? (
          <Button
            variant="primary"
            label={
              isApplePending ? "Ouverture d’Apple…" : " Continuer avec Apple"
            }
            accessibilityLabel="Continuer avec Apple"
            disabled={authPending}
            onPress={() => void signInWithApple()}
            testID="sign-in-apple"
          />
        ) : null}
        {process.env.EXPO_PUBLIC_OAUTH_GOOGLE_ENABLED === "true" ? (
          <Button
            variant="outline"
            label={
              isGooglePending
                ? "Ouverture de Google…"
                : "G  Continuer avec Google"
            }
            accessibilityLabel="Continuer avec Google"
            disabled={authPending}
            onPress={() => void signInWithGoogle()}
            testID="sign-in-google"
          />
        ) : null}

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.dividerRow}
        >
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
          <Txt variant="small" tone="muted">
            ou avec ton e-mail
          </Txt>
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
        </View>

        <Field
          label="Adresse e-mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="sign-in-email"
        />
        <Field
          label="Mot de passe"
          autoCapitalize="none"
          autoComplete="current-password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="sign-in-password"
        />

        <StatusText tone="danger">{error}</StatusText>

        <Button
          variant="honey"
          label={isPending ? "Connexion…" : "Se connecter"}
          accessibilityLabel="Se connecter"
          disabled={!email.trim() || !password || authPending}
          onPress={() => void signIn()}
          testID="sign-in-submit"
        />
      </Sticker>

      <Button
        variant="ghost"
        label="Mot de passe oublié ?"
        onPress={() => router.push("/forgot-password")}
      />
      <Button
        variant="ghost"
        label="Créer mon compte sur le web"
        onPress={() => {
          void Linking.openURL(`${appBaseUrl}/auth/signup`).catch(() =>
            setError(
              "Impossible d’ouvrir la création de compte pour le moment.",
            ),
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: space[3] },
  center: { textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
  divider: { flex: 1, height: 2, opacity: 0.25 },
});

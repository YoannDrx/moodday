import { color, radius, space } from "@moodday/design-tokens";
import type { AccountAccessDto } from "@moodday/contracts";
import { MoodDayApiError } from "@moodday/api-client";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { usePathname } from "expo-router";
import { useEffect, useState, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, appBaseUrl } from "../lib/api";
import { authClient } from "../lib/auth-client";
import {
  closeOwnerLocalDatabase,
  getLocalOperationSummary,
} from "../lib/local-database";

const labels = [
  "J’ai au moins 18 ans et je réside en France.",
  "J’accepte les conditions d’utilisation.",
  "J’ai lu la politique de confidentialité.",
  "Je consens explicitement au traitement de mes données de santé pour le suivi que je choisis. Je peux retirer ce consentement dans les réglages de confidentialité.",
];

// An owner-scoped, non-health marker preserves offline access only after a
// successful server check. A server refusal always removes this marker.
const accessKey = async (ownerId: string) =>
  `moodday.consent-access.${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, ownerId)}`;

export function AccountAccessGate({ children }: PropsWithChildren) {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const ownerId = session?.user.id;
  const sessionId = session?.session.id;
  const [state, setState] = useState<{
    sessionId?: string;
    access?: AccountAccessDto;
    allowed?: boolean;
    error?: string;
  }>({});
  const [attempt, setAttempt] = useState(0);
  const [accepted, setAccepted] = useState([false, false, false, false]);
  const [pending, setPending] = useState(false);
  const publicRoute = ["/sign-in", "/two-factor", "/forgot-password"].includes(
    pathname,
  );

  useEffect(() => {
    if (!ownerId || !sessionId || publicRoute) return;
    let active = true;
    setAccepted([false, false, false, false]);
    const load = async () => {
      const key = await accessKey(ownerId);
      try {
        const access = await api.getAccountAccess();
        const allowed = access.emailVerified && access.consentsAccepted;
        if (allowed)
          await SecureStore.setItemAsync(key, "verified", {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
          });
        else await SecureStore.deleteItemAsync(key);
        if (active) setState({ sessionId, access, allowed });
      } catch (error) {
        if (error instanceof MoodDayApiError) {
          if (!error.recoverable || error.code === "authentication_required")
            await SecureStore.deleteItemAsync(key);
        } else if ((await SecureStore.getItemAsync(key)) === "verified") {
          if (active) setState({ sessionId, allowed: true });
          return;
        }
        if (active)
          setState({
            sessionId,
            error:
              "La vérification du compte est indisponible. Reconnecte-toi à Internet puis réessaie.",
          });
      }
    };
    void load().catch(() => {
      if (active)
        setState({
          sessionId,
          error: "Impossible de vérifier l’accès sécurisé sur cet appareil.",
        });
    });
    return () => {
      active = false;
    };
  }, [ownerId, sessionId, attempt, publicRoute]);

  if (!ownerId || publicRoute) return <>{children}</>;
  if (state.sessionId === sessionId && state.allowed) return <>{children}</>;

  const accept = async () => {
    if (!state.access || !accepted.every(Boolean) || pending) return;
    setPending(true);
    try {
      const access = await api.acceptAccountConsents({
        age18Accepted: true,
        termsAccepted: true,
        privacyAccepted: true,
        healthDataConsentAccepted: true,
        locale: "fr",
        versions: state.access.versions,
      });
      await SecureStore.setItemAsync(await accessKey(ownerId), "verified", {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
      setState({
        sessionId,
        access,
        allowed: access.consentsAccepted && access.emailVerified,
      });
    } catch (error) {
      if (
        error instanceof MoodDayApiError &&
        error.code === "consent_version_changed"
      ) {
        setState({});
        setAttempt((value) => value + 1);
      } else
        setState((current) => ({
          ...current,
          error:
            "L’accord n’a pas été enregistré. Réessaie lorsque tu es connecté, ou contacte le support si tu as retiré un consentement.",
        }));
    } finally {
      setPending(false);
    }
  };

  const link = (path: string) => {
    void Linking.openURL(`${appBaseUrl}${path}`).catch(() =>
      setState((current) => ({
        ...current,
        error: "Le lien ne peut pas s’ouvrir pour le moment.",
      })),
    );
  };

  const signOut = async () => {
    if (pending) return;
    setPending(true);
    try {
      const summary = await getLocalOperationSummary(ownerId);
      if (summary.total > 0) {
        setState((current) => ({
          ...current,
          error:
            "Des données restent à synchroniser sur cet appareil. La déconnexion est bloquée pour les préserver. Rétablis l’accès au compte ou contacte le support.",
        }));
        return;
      }
      await closeOwnerLocalDatabase(ownerId);
      const result = await authClient.signOut();
      if (result.error) throw new Error("sign_out_failed");
    } catch {
      setState((current) => ({
        ...current,
        error: "La déconnexion sécurisée a échoué. Réessaie.",
      }));
    } finally {
      setPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ton espace, ton choix.</Text>
        {state.sessionId !== sessionId ? (
          <ActivityIndicator
            accessibilityLabel="Vérification du compte"
            color={color.primary}
          />
        ) : (
          <>
            {state.access?.emailVerified === false ? (
              <Text style={styles.text}>
                Vérifie ton adresse e-mail avant d’accéder à ton suivi. Ouvre le
                message Mood Day, puis reviens ici.
              </Text>
            ) : state.access ? (
              <>
                <Text style={styles.text}>
                  Avant de commencer, prends connaissance de ce que tu partages.
                  Aucun accord n’est précoché.
                </Text>
                {labels.map((label, index) => (
                  <Pressable
                    key={label}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: accepted[index],
                      disabled: pending,
                    }}
                    disabled={pending}
                    onPress={() =>
                      setAccepted((values) =>
                        values.map((value, position) =>
                          position === index ? !value : value,
                        ),
                      )
                    }
                    style={styles.choice}
                  >
                    <Text style={styles.text}>
                      {accepted[index] ? "☑" : "☐"} {label}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  disabled={pending || !accepted.every(Boolean)}
                  onPress={() => void accept()}
                  style={[
                    styles.button,
                    (pending || !accepted.every(Boolean)) && styles.disabled,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {pending ? "Enregistrement…" : "Continuer avec ces choix"}
                  </Text>
                </Pressable>
              </>
            ) : null}
            {state.error ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={styles.error}
              >
                {state.error}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={() => {
                setState({});
                setAttempt((value) => value + 1);
              }}
              style={styles.choice}
            >
              <Text style={styles.text}>Vérifier à nouveau</Text>
            </Pressable>
          </>
        )}
        <View style={styles.links}>
          {(
            [
              ["Conditions d’utilisation", "/legal/terms"],
              ["Confidentialité", "/legal/privacy"],
              ["Contacter le support", "/contact"],
            ] as const
          ).map(([label, path]) => (
            <Pressable
              key={path}
              accessibilityRole="link"
              onPress={() => link(path)}
              style={styles.choice}
            >
              <Text style={styles.link}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={() => void signOut()}
          style={styles.choice}
        >
          <Text style={styles.text}>Me déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.canvas },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: space[6],
    gap: space[4],
  },
  title: { fontSize: 28, fontWeight: "700", color: color.ink },
  text: { fontSize: 16, lineHeight: 24, color: color.ink },
  choice: {
    minHeight: 48,
    paddingVertical: space[3],
    justifyContent: "center",
  },
  button: {
    minHeight: 50,
    padding: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.primary,
  },
  buttonText: {
    fontSize: 16,
    color: color.surfaceStrong,
    textAlign: "center",
    fontWeight: "700",
  },
  disabled: { opacity: 0.5 },
  error: { color: color.danger, fontSize: 16 },
  link: { color: color.primary, textDecorationLine: "underline", fontSize: 16 },
  links: { gap: space[1] },
});

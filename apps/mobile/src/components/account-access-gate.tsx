import { radius, space, sticker } from "@moodday/design-tokens";
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
import { countOfflineCheckIns } from "../lib/offline-queue";
import { signOutOfMoodday } from "../lib/sign-out";
import { usePalette } from "../lib/theme";
import { Bouyotte } from "./bouyotte";
import { HelpButton } from "./help-button";
import { Button, Sticker, Txt } from "./ui";

const labels = [
  "J’ai au moins 18 ans et je réside en France.",
  "J’accepte les conditions d’utilisation.",
  "J’ai lu la politique de confidentialité.",
  "Je consens explicitement au traitement de mes données de santé (cycle, ressenti du jour, besoins) pour utiliser Moodday. Je peux retirer ce consentement dans les réglages de confidentialité.",
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
  const [verificationNotice, setVerificationNotice] = useState<string>();
  const palette = usePalette();
  const publicRoute = [
    "/sign-in",
    "/two-factor",
    "/forgot-password",
    "/help",
  ].includes(pathname);

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

  const resendVerification = async () => {
    const email = session.user.email;
    if (!email || pending) return;
    setPending(true);
    setVerificationNotice(undefined);
    try {
      const result = await authClient.sendVerificationEmail({ email });
      if (result.error) throw new Error("verification_email_failed");
      setVerificationNotice(
        "Un nouveau lien vient de partir. Il expire dans une heure.",
      );
    } catch {
      setState((current) => ({
        ...current,
        error:
          "L’e-mail n’a pas pu être envoyé. Réessaie dans quelques minutes ou contacte le support.",
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
      if ((await countOfflineCheckIns(ownerId)) > 0) {
        setState((current) => ({
          ...current,
          error:
            "Un point fait hors ligne attend encore le réseau. La déconnexion est bloquée pour ne pas le perdre : reconnecte-toi à Internet, puis réessaie.",
        }));
        return;
      }
      await signOutOfMoodday(ownerId);
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
    <SafeAreaView style={[styles.page, { backgroundColor: palette.canvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <HelpButton />
        </View>
        <View style={styles.hero}>
          <Bouyotte mood="wink" size={88} />
          <Txt variant="display" accessibilityRole="header" style={styles.flex}>
            Ton espace, ton choix.
          </Txt>
        </View>
        {state.sessionId !== sessionId ? (
          <ActivityIndicator
            accessibilityLabel="Vérification du compte"
            color={palette.ink}
          />
        ) : (
          <>
            {state.access?.emailVerified === false ? (
              <Sticker>
                <Txt>
                  Vérifie ton adresse e-mail avant d’entrer dans Moodday. Ouvre
                  le message qu’on t’a envoyé, puis reviens ici.
                </Txt>
                <Button
                  variant="honey"
                  label={pending ? "Envoi…" : "Renvoyer le lien"}
                  disabled={pending}
                  onPress={() => void resendVerification()}
                />
                {verificationNotice ? (
                  <Txt accessibilityLiveRegion="polite">
                    {verificationNotice}
                  </Txt>
                ) : null}
              </Sticker>
            ) : state.access ? (
              <Sticker>
                <Txt>
                  Avant de commencer, prends connaissance de ce que tu confies à
                  Moodday. Aucun accord n’est précoché.
                </Txt>
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
                    <View
                      style={[
                        styles.box,
                        {
                          borderColor: palette.border,
                          backgroundColor: accepted[index]
                            ? palette.honey
                            : palette.surfaceStrong,
                        },
                      ]}
                    >
                      <Text style={styles.boxMark}>
                        {accepted[index] ? "✓" : ""}
                      </Text>
                    </View>
                    <Txt style={styles.flex}>{label}</Txt>
                  </Pressable>
                ))}
                <Button
                  variant="honey"
                  label={
                    pending ? "Enregistrement…" : "Continuer avec ces choix"
                  }
                  disabled={pending || !accepted.every(Boolean)}
                  onPress={() => void accept()}
                />
              </Sticker>
            ) : null}
            {state.error ? (
              <Txt
                tone="danger"
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                {state.error}
              </Txt>
            ) : null}
            <Button
              variant="outline"
              label="Vérifier à nouveau"
              disabled={pending}
              onPress={() => {
                setState({});
                setAttempt((value) => value + 1);
              }}
            />
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
              style={styles.link}
            >
              <Txt style={styles.underline}>{label}</Txt>
            </Pressable>
          ))}
        </View>
        <Button
          variant="ghost"
          label="Me déconnecter"
          disabled={pending}
          onPress={() => void signOut()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: space[5],
    gap: space[4],
  },
  topBar: { alignItems: "flex-end" },
  hero: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1 },
  choice: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[3],
    paddingVertical: space[2],
  },
  box: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: sticker.borderWidth,
    borderRadius: radius.small / 2,
  },
  boxMark: { fontSize: 16, fontWeight: "800", color: "#2B1B30" },
  link: { minHeight: 44, justifyContent: "center" },
  links: { gap: space[1] },
  underline: { textDecorationLine: "underline", fontWeight: "700" },
});

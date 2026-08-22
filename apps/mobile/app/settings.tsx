import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BrandIllustration } from "../src/components/brand-illustration";
import { Screen } from "../src/components/screen";
import { SectionCard } from "../src/components/section-card";
import { authClient } from "../src/lib/auth-client";
import {
  closeOwnerLocalDatabase,
  getLocalOperationSummary,
  purgeOwnerLocalData,
  synchronizeNow,
} from "../src/lib/local-database";
import type { LocalOperationSummary } from "../src/lib/local-database-core";

const emptySummary: LocalOperationSummary = {
  pending: 0,
  conflict: 0,
  rejected: 0,
  total: 0,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [summary, setSummary] = useState(emptySummary);
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<string>();

  const refreshSummary = useCallback(async () => {
    if (!ownerId) return emptySummary;
    const nextSummary = await getLocalOperationSummary(ownerId);
    setSummary(nextSummary);
    return nextSummary;
  }, [ownerId]);

  useEffect(() => {
    refreshSummary().catch(() =>
      setStatus("Impossible de lire l’état local pour le moment."),
    );
  }, [refreshSummary]);

  const finishSignOut = async ({ purge }: { purge: boolean }) => {
    if (!ownerId) return;
    setIsPending(true);
    setStatus(undefined);
    let localActionCompleted = false;
    try {
      if (purge) await purgeOwnerLocalData(ownerId);
      else await closeOwnerLocalDatabase(ownerId);
      localActionCompleted = true;
      const result = await authClient.signOut();
      if (result.error) throw new Error("sign_out_failed");
      router.replace("/sign-in");
    } catch {
      setStatus(
        purge && !localActionCompleted
          ? "Les données n’ont pas toutes pu être effacées. Réessaie avant de quitter l’app."
          : purge
            ? "Les données locales sont effacées, mais la déconnexion a échoué. Réessaie."
            : "Déconnexion impossible. Tes données locales restent protégées.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const synchronize = async ({ signOutAfter = false } = {}) => {
    if (!ownerId) return;
    setIsPending(true);
    setStatus("Synchronisation en cours…");
    try {
      await synchronizeNow(ownerId);
      const nextSummary = await refreshSummary();
      if (nextSummary.total > 0) {
        setStatus(
          "Certaines données demandent encore ton attention. Elles restent chiffrées sur cet appareil.",
        );
        return;
      }
      if (signOutAfter) {
        await finishSignOut({ purge: false });
        return;
      }
      setStatus("Tout est synchronisé avec Mood Day.");
    } catch {
      setStatus(
        "Synchronisation indisponible. Rien n’est perdu : les données restent sur cet appareil.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const requestSignOut = () => {
    if (summary.total === 0) {
      void finishSignOut({ purge: false });
      return;
    }
    Alert.alert(
      "Déconnexion protégée",
      `${summary.total} élément${summary.total > 1 ? "s ne sont" : " n’est"} pas encore synchronisé${summary.total > 1 ? "s" : ""}. Synchronise avant de te déconnecter, ou efface explicitement les données de cet appareil.`,
      summary.pending > 0
        ? [
            { text: "Rester connecté", style: "cancel" },
            {
              text: "Synchroniser",
              onPress: () => void synchronize({ signOutAfter: true }),
            },
          ]
        : [{ text: "Rester connecté", style: "cancel" }],
    );
  };

  const requestPurge = () => {
    Alert.alert(
      "Effacer les données de cet appareil ?",
      "Les brouillons et opérations non synchronisés seront définitivement perdus. Les données déjà synchronisées resteront dans ton compte Mood Day.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer et se déconnecter",
          style: "destructive",
          onPress: () => void finishSignOut({ purge: true }),
        },
      ],
    );
  };

  const unresolved = summary.conflict + summary.rejected;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer les réglages"
          disabled={isPending}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
        <BrandIllustration variant="privacy" style={styles.illustration} />
        <Text style={styles.title}>Compte et appareil</Text>
        <Text style={styles.subtitle}>
          Tu gardes la main sur la session et sur les données chiffrées stockées
          ici.
        </Text>
      </View>

      <SectionCard
        eyebrow="Synchronisation"
        title={
          summary.total === 0 ? "Tout est à jour" : "Des éléments restent ici"
        }
        description={
          summary.total === 0
            ? "Tu peux te déconnecter sans perdre de saisie locale."
            : `${summary.pending} en attente · ${unresolved} à vérifier`
        }
      >
        {summary.total > 0 ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending || summary.pending === 0}
            onPress={() => void synchronize()}
            style={({ pressed }) => [
              styles.primaryButton,
              (isPending || summary.pending === 0) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>
              {isPending ? "Traitement en cours…" : "Synchroniser maintenant"}
            </Text>
          </Pressable>
        ) : null}
        {status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard
        eyebrow="Session"
        title="Se déconnecter"
        description="Les données locales synchronisées restent chiffrées pour accélérer ta prochaine connexion avec ce même compte."
      >
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={requestSignOut}
          style={({ pressed }) => [
            styles.secondaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Se déconnecter</Text>
        </Pressable>
      </SectionCard>

      <SectionCard
        eyebrow="Cet appareil"
        title="Effacer les données locales"
        description="Cette action supprime la base chiffrée et sa clé de cet appareil, puis te déconnecte. Elle ne supprime pas ton compte."
      >
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={requestPurge}
          style={({ pressed }) => [
            styles.dangerButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.dangerLabel}>Effacer et se déconnecter</Text>
        </Pressable>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: space[2], paddingBottom: space[2] },
  closeButton: {
    minWidth: 48,
    minHeight: 48,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  closeLabel: { color: color.primaryDeep, fontSize: 15, fontWeight: "700" },
  illustration: { width: 190, height: 122 },
  title: {
    color: color.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 330,
    color: color.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
    paddingHorizontal: space[4],
  },
  primaryLabel: { color: color.surfaceStrong, fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
  },
  secondaryLabel: { color: color.primaryDeep, fontSize: 16, fontWeight: "700" },
  dangerButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.danger,
    borderRadius: radius.medium,
    backgroundColor: color.dangerSoft,
  },
  dangerLabel: { color: color.danger, fontSize: 16, fontWeight: "700" },
  status: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

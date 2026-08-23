import { color, radius, space } from "@moodday/design-tokens";
import type { EntitlementDto } from "@moodday/contracts";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BrandIllustration } from "../src/components/brand-illustration";
import { Screen } from "../src/components/screen";
import { SectionCard } from "../src/components/section-card";
import { authClient } from "../src/lib/auth-client";
import { api, appBaseUrl } from "../src/lib/api";
import {
  exportAndShareAccountData,
  MobileAccountDataError,
} from "../src/lib/account-data";
import {
  closeOwnerLocalDatabase,
  getCachedMedications,
  getLocalOperationSummary,
  purgeOwnerLocalData,
  synchronizeNow,
} from "../src/lib/local-database";
import type { LocalOperationSummary } from "../src/lib/local-database-core";
import {
  defaultLocalReminderPreferences,
  type LocalReminderPreferences,
} from "../src/lib/notification-planner";
import {
  getLocalNotificationPermission,
  getLocalReminderPreferences,
  updateLocalNotificationSchedule,
} from "../src/lib/notifications";
import {
  isMobileBillingAvailable,
  presentPlusPaywall,
  restorePlusPurchases,
  showMobileSubscriptionManagement,
} from "../src/lib/purchases";

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
  const [entitlement, setEntitlement] = useState<EntitlementDto>();
  const [billingStatus, setBillingStatus] = useState<string>();
  const [notificationPreferences, setNotificationPreferences] =
    useState<LocalReminderPreferences>(defaultLocalReminderPreferences);
  const [notificationStatus, setNotificationStatus] = useState<string>();
  const [accountDataStatus, setAccountDataStatus] = useState<string>();

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

  const refreshEntitlement = useCallback(async () => {
    if (!ownerId) return;
    try {
      setEntitlement(await api.getEntitlements());
    } catch {
      setBillingStatus("Le statut Plus est temporairement indisponible.");
    }
  }, [ownerId]);

  useEffect(() => {
    void refreshEntitlement();
  }, [refreshEntitlement]);

  useEffect(() => {
    Promise.all([
      getLocalReminderPreferences(),
      getLocalNotificationPermission(),
    ])
      .then(([preferences, permitted]) =>
        setNotificationPreferences({
          ...preferences,
          enabled: preferences.enabled && permitted,
        }),
      )
      .catch(() =>
        setNotificationStatus(
          "L’état des rappels est momentanément indisponible.",
        ),
      );
  }, []);

  const updateNotifications = async (
    preferences: LocalReminderPreferences,
    requestPermission = false,
  ) => {
    if (!ownerId) return;
    setIsPending(true);
    setNotificationStatus("Mise à jour des rappels sur cet iPhone…");
    try {
      const medications = await getCachedMedications(ownerId);
      const result = await updateLocalNotificationSchedule({
        medications,
        preferences,
        requestPermission,
      });
      const next = {
        ...preferences,
        enabled: preferences.enabled && result.permitted,
      };
      setNotificationPreferences(next);
      setNotificationStatus(
        preferences.enabled && !result.permitted
          ? "Les notifications restent refusées dans les réglages iOS. Mood Day continue de fonctionner normalement."
          : next.enabled
            ? `${result.scheduled} rappel${result.scheduled > 1 ? "s" : ""} générique${result.scheduled > 1 ? "s" : ""} planifié${result.scheduled > 1 ? "s" : ""} localement.`
            : "Les rappels Mood Day sont désactivés sur cet iPhone.",
      );
    } catch {
      setNotificationStatus(
        "Les rappels n’ont pas pu être modifiés. Les réglages précédents restent prioritaires.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const runBillingAction = async (
    action: (userId: string) => Promise<EntitlementDto | undefined>,
    pendingMessage: string,
  ) => {
    if (!ownerId) return;
    setIsPending(true);
    setBillingStatus(pendingMessage);
    try {
      const result = await action(ownerId);
      if (result) setEntitlement(result);
      else await refreshEntitlement();
      setBillingStatus("Ton statut Plus est à jour sur tous tes appareils.");
    } catch {
      setBillingStatus(
        "L’opération n’a pas abouti. Aucun achat n’a été appliqué deux fois ; tu peux réessayer.",
      );
    } finally {
      setIsPending(false);
    }
  };

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

  const exportAccountData = async () => {
    setIsPending(true);
    setAccountDataStatus("Préparation de ton export complet…");
    try {
      await exportAndShareAccountData();
      setAccountDataStatus(
        "L’export a été remis à l’app que tu as choisie, puis sa copie temporaire a été effacée.",
      );
    } catch (error) {
      setAccountDataStatus(
        error instanceof MobileAccountDataError &&
          error.code === "recent_authentication_required"
          ? "Pour protéger tes données, reconnecte-toi puis relance l’export dans les dix minutes."
          : "L’export n’a pas abouti. Aucune copie temporaire n’a été conservée.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const requestAccountDeletion = () => {
    Alert.alert(
      "Demander la suppression du compte ?",
      "Mood Day enverra un lien de confirmation à ton adresse e-mail. Après confirmation, le compte et ses données seront définitivement supprimés, sous réserve des obligations légales de conservation.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer le lien",
          style: "destructive",
          onPress: () => {
            setIsPending(true);
            setAccountDataStatus("Envoi du lien de confirmation…");
            void authClient
              .deleteUser({ callbackURL: `${appBaseUrl}/auth/goodbye` })
              .then((result) => {
                if (result.error) throw new Error("delete_request_failed");
                setAccountDataStatus(
                  "Lien envoyé. Le compte ne sera supprimé qu’après ta confirmation par e-mail.",
                );
              })
              .catch(() =>
                setAccountDataStatus(
                  "La demande n’a pas abouti. Ton compte et tes données restent inchangés.",
                ),
              )
              .finally(() => setIsPending(false));
          },
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
        eyebrow="Connexions"
        title="Santé et calendriers"
        description="Chaque source reste facultative, limitée et révocable."
      >
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={() => router.push("/calendar-connections")}
          style={({ pressed }) => [
            styles.secondaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Gérer la connexion</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={() => router.push("/health-connections")}
          style={({ pressed }) => [
            styles.secondaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Gérer Santé sur iPhone</Text>
        </Pressable>
      </SectionCard>

      <SectionCard
        eyebrow="Toujours accessible"
        title="Plan de sécurité personnel"
        description="Une copie privée et chiffrée reste lisible hors ligne sur cet iPhone. Elle n’est jamais partagée automatiquement."
      >
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={() => router.push("/safety-plan")}
          style={({ pressed }) => [
            styles.secondaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Ouvrir mon plan</Text>
        </Pressable>
      </SectionCard>

      <SectionCard
        eyebrow="Rappels iOS"
        title={
          notificationPreferences.enabled
            ? "Rappels activés sur cet iPhone"
            : "Rappels désactivés"
        }
        description="Les rappels sont planifiés localement, avec un contenu générique. Aucun nom de traitement n’apparaît sur l’écran verrouillé."
      >
        {notificationPreferences.enabled ? (
          <>
            <PreferenceSwitch
              disabled={isPending}
              label={`Point quotidien · ${notificationPreferences.dailyCheckInTime}`}
              selected={notificationPreferences.dailyCheckIn}
              onPress={() =>
                void updateNotifications({
                  ...notificationPreferences,
                  dailyCheckIn: !notificationPreferences.dailyCheckIn,
                })
              }
            />
            <PreferenceSwitch
              disabled={isPending}
              label="Rappels de traitement"
              selected={notificationPreferences.medicationReminders}
              onPress={() =>
                void updateNotifications({
                  ...notificationPreferences,
                  medicationReminders:
                    !notificationPreferences.medicationReminders,
                })
              }
            />
          </>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={() =>
            void updateNotifications(
              {
                ...notificationPreferences,
                enabled: !notificationPreferences.enabled,
              },
              !notificationPreferences.enabled,
            )
          }
          style={({ pressed }) => [
            notificationPreferences.enabled
              ? styles.secondaryButton
              : styles.primaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={
              notificationPreferences.enabled
                ? styles.secondaryLabel
                : styles.primaryLabel
            }
          >
            {notificationPreferences.enabled
              ? "Désactiver les rappels"
              : "Autoriser les rappels"}
          </Text>
        </Pressable>
        {notificationStatus ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {notificationStatus}
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard
        eyebrow="Abonnement"
        title={
          entitlement?.active ? "Mood Day Plus est actif" : "Mood Day Plus"
        }
        description={
          entitlement?.duplicateSubscription
            ? "Deux abonnements actifs ont été détectés. Mood Day ne les annule jamais automatiquement. Ouvre la gestion de chaque plateforme pour éviter une double facturation."
            : entitlement?.active
              ? `Ton accès est commun au web et au mobile${entitlement.validUntil ? ` jusqu’au ${new Date(entitlement.validUntil).toLocaleDateString("fr-FR")}` : ""}.`
              : "Débloque les fonctionnalités Plus sur le web, l’iPhone et Android avec un seul droit partagé."
        }
      >
        {entitlement?.active && entitlement.manageWith !== "stripe" ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending || !isMobileBillingAvailable()}
            onPress={() =>
              void runBillingAction(
                showMobileSubscriptionManagement,
                "Ouverture de la gestion de l’abonnement…",
              )
            }
            style={({ pressed }) => [
              styles.primaryButton,
              (isPending || !isMobileBillingAvailable()) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>Gérer l’abonnement</Text>
          </Pressable>
        ) : !entitlement?.active ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending || !isMobileBillingAvailable()}
            onPress={() =>
              void runBillingAction(
                presentPlusPaywall,
                "Chargement des offres sécurisées…",
              )
            }
            style={({ pressed }) => [
              styles.primaryButton,
              (isPending || !isMobileBillingAvailable()) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>Voir les offres Plus</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isPending || !isMobileBillingAvailable()}
          onPress={() =>
            void runBillingAction(
              restorePlusPurchases,
              "Restauration des achats en cours…",
            )
          }
          style={({ pressed }) => [
            styles.secondaryButton,
            (isPending || !isMobileBillingAvailable()) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Restaurer mes achats</Text>
        </Pressable>
        {!isMobileBillingAvailable() ? (
          <Text style={styles.status}>
            Les achats mobiles ne sont pas activés dans cette version de l’app.
          </Text>
        ) : null}
        {billingStatus ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {billingStatus}
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
        eyebrow="Tes données"
        title="Exporter ou supprimer"
        description="L’export contient les données de ton compte. La suppression exige une confirmation reçue par e-mail et n’est jamais immédiate au premier toucher."
      >
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={() => void exportAccountData()}
          style={({ pressed }) => [
            styles.secondaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Exporter toutes mes données</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={requestAccountDeletion}
          style={({ pressed }) => [
            styles.dangerButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.dangerLabel}>Supprimer mon compte</Text>
        </Pressable>
        {accountDataStatus ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {accountDataStatus}
          </Text>
        ) : null}
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

function PreferenceSwitch({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.preferenceRow,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.preferenceLabel}>{label}</Text>
      <View
        style={[styles.switchTrack, selected && styles.switchTrackSelected]}
      >
        <View
          style={[styles.switchThumb, selected && styles.switchThumbSelected]}
        />
      </View>
    </Pressable>
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
  preferenceRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[3],
  },
  preferenceLabel: {
    flex: 1,
    color: color.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  switchTrack: {
    width: 50,
    height: 30,
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: color.border,
    paddingHorizontal: 3,
  },
  switchTrackSelected: { backgroundColor: color.primary },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.surfaceStrong,
  },
  switchThumbSelected: { alignSelf: "flex-end" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

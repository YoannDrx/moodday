import type {
  HealthPermission,
  HealthSourceConnectionDto,
} from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandIllustration } from "../src/components/brand-illustration";
import { Screen } from "../src/components/screen";
import { SectionCard } from "../src/components/section-card";
import { api } from "../src/lib/api";
import { authClient } from "../src/lib/auth-client";
import {
  isHealthKitAvailable,
  requestHealthKitPermissions,
  synchronizeHealthKit,
} from "../src/lib/healthkit";
import { deleteRawHealthSamples } from "../src/lib/local-database";

const permissionOptions: readonly {
  id: HealthPermission;
  title: string;
  description: string;
}[] = [
  {
    id: "sleep_duration_minutes",
    title: "Sommeil",
    description: "Durée de sommeil, sans détail de phase envoyé au serveur.",
  },
  {
    id: "step_count",
    title: "Pas",
    description: "Total journalier observé par Santé.",
  },
  {
    id: "active_energy_kcal",
    title: "Énergie active",
    description: "Énergie active journalière en kilocalories.",
  },
  {
    id: "workout_minutes",
    title: "Entraînements",
    description: "Durée totale, sans trajet ni localisation.",
  },
  {
    id: "resting_heart_rate_bpm",
    title: "Fréquence cardiaque au repos",
    description: "Moyenne journalière lorsqu’elle est disponible.",
  },
  {
    id: "hrv_sdnn_ms",
    title: "Variabilité cardiaque",
    description: "Moyenne SDNN journalière lorsqu’elle est disponible.",
  },
];

const defaultPermissions: HealthPermission[] = [
  "sleep_duration_minutes",
  "step_count",
  "active_energy_kcal",
];

const friendlyError = (error: unknown) => {
  if (error instanceof Error && error.message.includes("Recent")) {
    return "Reconnecte-toi avant de supprimer ces données sensibles.";
  }
  return "L’opération n’a pas abouti. Tes données locales restent protégées.";
};

export default function HealthConnectionsScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [connection, setConnection] = useState<HealthSourceConnectionDto>();
  const [permissions, setPermissions] =
    useState<HealthPermission[]>(defaultPermissions);
  const [available, setAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<string>();

  const load = useCallback(async () => {
    try {
      const [capabilities, source] = await Promise.all([
        api.getRuntimeCapabilities(),
        api.getHealthKitConnection(),
      ]);
      setAvailable(
        Platform.OS === "ios" &&
          capabilities.healthKit &&
          isHealthKitAvailable(),
      );
      if (source) {
        setConnection(source);
        setPermissions(source.permissionScope);
      }
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePermission = (permission: HealthPermission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const sync = async (source = connection) => {
    if (!ownerId || !source) return;
    setIsPending(true);
    setStatus("Lecture et calcul sur cet iPhone…");
    try {
      const result = await synchronizeHealthKit({
        ownerId,
        connectionId: source.id,
        permissions,
      });
      setStatus(
        result.accepted > 0
          ? `${result.accepted} repère${result.accepted > 1 ? "s" : ""} journalier${result.accepted > 1 ? "s" : ""} synchronisé${result.accepted > 1 ? "s" : ""}.`
          : "Aucune mesure disponible sur la période. Une absence n’est jamais transformée en zéro.",
      );
      await load();
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
    }
  };

  const connect = async () => {
    if (permissions.length === 0) {
      setStatus("Choisis au moins un type de donnée.");
      return;
    }
    setIsPending(true);
    setStatus("Ouverture des autorisations Santé…");
    try {
      const requested = await requestHealthKitPermissions(permissions);
      if (!requested) throw new Error("healthkit_authorization_failed");
      const source = await api.connectHealthKit({
        permissionScope: permissions,
      });
      setConnection(source);
      await sync(source);
    } catch (error) {
      setStatus(friendlyError(error));
      setIsPending(false);
    }
  };

  const updateScope = async () => {
    if (!connection || permissions.length === 0) return;
    setIsPending(true);
    try {
      const requested = await requestHealthKitPermissions(permissions);
      if (!requested) throw new Error("healthkit_authorization_failed");
      setConnection(
        await api.updateHealthKitConnection(connection.id, {
          status: "active",
          permissionScope: permissions,
        }),
      );
      setStatus("Les types choisis sont enregistrés.");
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
    }
  };

  const togglePause = async () => {
    if (!connection) return;
    setIsPending(true);
    try {
      const nextStatus = connection.status === "paused" ? "active" : "paused";
      setConnection(
        await api.updateHealthKitConnection(connection.id, {
          status: nextStatus,
        }),
      );
      setStatus(
        nextStatus === "paused"
          ? "Synchronisation en pause."
          : "Synchronisation reprise.",
      );
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
    }
  };

  const disconnect = () => {
    if (!connection || !ownerId) return;
    Alert.alert(
      "Déconnecter Santé ?",
      "Les agrégats synchronisés et les copies brutes chiffrées sur cet appareil seront supprimés. Mood Day ne peut pas modifier les données de l’app Santé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter et supprimer",
          style: "destructive",
          onPress: () => {
            setIsPending(true);
            api
              .revokeHealthKitConnection(connection.id)
              .then(async () => {
                await deleteRawHealthSamples(ownerId);
                setConnection(undefined);
                setStatus(
                  "Santé est déconnecté et ses données Mood Day sont supprimées.",
                );
              })
              .catch((error: unknown) => setStatus(friendlyError(error)))
              .finally(() => setIsPending(false));
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer les connexions Santé"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
        <BrandIllustration variant="landmarks" style={styles.illustration} />
        <Text style={styles.title}>Santé, à ton rythme</Text>
        <Text style={styles.subtitle}>
          Tu choisis chaque type. Les mesures brutes restent dans Santé et dans
          la base chiffrée de cet iPhone ; seuls des repères journaliers sont
          envoyés à Mood Day.
        </Text>
      </View>

      <SectionCard
        eyebrow="Autorisations"
        title="Choisir précisément"
        description="Apple ne permet pas à une app de savoir si une lecture précise a été refusée. Une mesure absente restera donc simplement absente."
      >
        {permissionOptions.map((option) => {
          const selected = permissions.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              disabled={isPending}
              onPress={() => togglePermission(option.id)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.choiceTitle}>
                {selected ? "✓ " : ""}
                {option.title}
              </Text>
              <Text style={styles.choiceDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
        {isLoading ? <ActivityIndicator color={color.primary} /> : null}
        {!connection ? (
          <Pressable
            accessibilityRole="button"
            disabled={!available || isPending || permissions.length === 0}
            onPress={() => void connect()}
            style={({ pressed }) => [
              styles.primaryButton,
              (!available || isPending || permissions.length === 0) &&
                styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>
              {available
                ? "Autoriser sur cet iPhone"
                : "Indisponible dans cette version"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.stack}>
            <Pressable
              accessibilityRole="button"
              disabled={isPending || connection.status !== "active"}
              onPress={() => void sync()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>Synchroniser 14 jours</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={() => void updateScope()}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryLabel}>
                Enregistrer les types choisis
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={() => void togglePause()}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryLabel}>
                {connection.status === "paused"
                  ? "Reprendre"
                  : "Mettre en pause"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={disconnect}
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.dangerLabel}>Déconnecter et supprimer</Text>
            </Pressable>
          </View>
        )}
        {status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
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
    maxWidth: 340,
    color: color.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  stack: { gap: space[3] },
  choice: {
    minHeight: 72,
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
    padding: space[3],
  },
  choiceSelected: {
    borderColor: color.primary,
    backgroundColor: color.primarySoft,
  },
  choiceTitle: { color: color.ink, fontSize: 15, fontWeight: "700" },
  choiceDescription: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
    paddingHorizontal: space[4],
  },
  primaryLabel: { color: color.surfaceStrong, fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
    paddingHorizontal: space[3],
  },
  secondaryLabel: { color: color.primaryDeep, fontSize: 15, fontWeight: "700" },
  dangerButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.danger,
    borderRadius: radius.medium,
    backgroundColor: color.dangerSoft,
  },
  dangerLabel: { color: color.danger, fontSize: 15, fontWeight: "700" },
  status: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

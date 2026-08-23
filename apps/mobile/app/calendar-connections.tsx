import type {
  CalendarConflictDto,
  CalendarConnectionDto,
} from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";

const friendlyError = (error: unknown) => {
  if (!(error instanceof Error)) return "La connexion a échoué.";
  if (error.message.includes("recent")) {
    return "Reconnecte-toi à Google pour confirmer cette action sensible.";
  }
  if (error.message.includes("authorization")) {
    return "L’autorisation Google Agenda doit être confirmée.";
  }
  return "Google Agenda est momentanément indisponible.";
};

export default function CalendarConnectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ calendar?: string }>();
  const callbackHandled = useRef(false);
  const [connection, setConnection] = useState<CalendarConnectionDto>();
  const [conflicts, setConflicts] = useState<CalendarConflictDto[]>([]);
  const [available, setAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<string>();

  const load = useCallback(async () => {
    try {
      const [capabilities, connections] = await Promise.all([
        api.getRuntimeCapabilities(),
        api.listCalendarConnections(),
      ]);
      setAvailable(capabilities.googleCalendar);
      const google = connections.find(
        (item) => item.provider === "google" && item.status !== "revoked",
      );
      setConnection(google);
      setConflicts(
        google ? await api.listCalendarConflicts(google.id) : [],
      );
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const completeConnection = useCallback(async () => {
    setIsPending(true);
    setStatus("Création de l’agenda Mood Day…");
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const next = await api.createGoogleCalendarConnection({
        operationId: Crypto.randomUUID(),
        connectionId: Crypto.randomUUID(),
        sourceConnectionId: Crypto.randomUUID(),
        timezone,
        displayName: "Mood Day",
        detailLevel: "generic",
      });
      await api.synchronizeGoogleCalendar(next.id);
      setStatus("Google Agenda est connecté et à jour.");
      await load();
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
      router.setParams({ calendar: undefined });
    }
  }, [load, router]);

  useEffect(() => {
    if (params.calendar !== "linked" || callbackHandled.current) return;
    callbackHandled.current = true;
    void completeConnection();
  }, [completeConnection, params.calendar]);

  const authorize = async () => {
    setIsPending(true);
    setStatus(undefined);
    const result = await authClient.linkSocial({
      provider: "google",
      callbackURL: Linking.createURL("/calendar-connections", {
        queryParams: { calendar: "linked" },
      }),
      scopes: [GOOGLE_CALENDAR_SCOPE],
    });
    if (result.error) {
      setStatus("L’autorisation Google n’a pas abouti.");
      setIsPending(false);
    }
  };

  const update = async (
    input: { status?: "active" | "paused"; detailLevel?: "generic" | "appointment" },
  ) => {
    if (!connection) return;
    setIsPending(true);
    try {
      setConnection(await api.updateCalendarConnection(connection.id, input));
      setStatus("Le réglage est enregistré.");
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
    }
  };

  const synchronize = async () => {
    if (!connection) return;
    setIsPending(true);
    setStatus("Synchronisation en cours…");
    try {
      const result = await api.synchronizeGoogleCalendar(connection.id);
      setStatus(
        result.conflicts > 0
          ? `${result.conflicts} choix demande ton attention.`
          : "Les rendez-vous sont à jour.",
      );
      await load();
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
    }
  };

  const disconnect = () => {
    if (!connection) return;
    Alert.alert(
      "Déconnecter Google Agenda ?",
      "La synchronisation s’arrête. L’agenda Mood Day reste dans Google et rien n’est supprimé silencieusement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: () => {
            setIsPending(true);
            api
              .revokeCalendarConnection(connection.id)
              .then(() => {
                setConnection(undefined);
                setConflicts([]);
                setStatus("La connexion est révoquée.");
              })
              .catch((error: unknown) => setStatus(friendlyError(error)))
              .finally(() => setIsPending(false));
          },
        },
      ],
    );
  };

  const resolve = async (
    conflict: CalendarConflictDto,
    resolution: "moodday" | "google",
  ) => {
    setIsPending(true);
    try {
      await api.resolveCalendarConflict(
        conflict.connectionId,
        conflict.id,
        { resolution },
      );
      await load();
      setStatus("Le choix est appliqué.");
    } catch (error) {
      setStatus(friendlyError(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer les connexions"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
        <BrandIllustration variant="connections" style={styles.illustration} />
        <Text style={styles.title}>Connexions</Text>
        <Text style={styles.subtitle}>
          Relie seulement les services qui t’aident, avec un périmètre clair et
          révocable.
        </Text>
      </View>

      <SectionCard
        eyebrow="Google Agenda"
        title={connection ? "Agenda Mood Day connecté" : "Un agenda vraiment dédié"}
        description="Mood Day peut créer et gérer uniquement l’agenda secondaire qu’il crée. Tes autres agendas ne sont ni lus ni analysés."
      >
        {isLoading ? <ActivityIndicator color={color.primary} /> : null}
        {!isLoading && !connection ? (
          <Pressable
            accessibilityRole="button"
            disabled={!available || isPending}
            onPress={() => void authorize()}
            style={({ pressed }) => [
              styles.primaryButton,
              (!available || isPending) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>
              {available ? "Connecter Google Agenda" : "Bientôt disponible"}
            </Text>
          </Pressable>
        ) : null}

        {connection ? (
          <View style={styles.stack}>
            <Text style={styles.body}>
              {connection.status === "active"
                ? "Synchronisation active"
                : "Synchronisation en pause"}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isPending || connection.status !== "active"}
              onPress={() => void synchronize()}
              style={({ pressed }) => [
                styles.primaryButton,
                (isPending || connection.status !== "active") && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>Synchroniser</Text>
            </Pressable>
            <View accessibilityRole="radiogroup" style={styles.stack}>
              <Text style={styles.label}>Détails visibles dans Google</Text>
              {(["generic", "appointment"] as const).map((level) => (
                <Pressable
                  key={level}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: connection.detailLevel === level }}
                  disabled={isPending}
                  onPress={() => void update({ detailLevel: level })}
                  style={({ pressed }) => [
                    styles.choice,
                    connection.detailLevel === level && styles.choiceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.choiceTitle}>
                    {level === "generic"
                      ? "Discret — Rendez-vous Mood Day"
                      : "Détaillé — titre et lieu"}
                  </Text>
                  <Text style={styles.choiceDescription}>
                    {level === "generic"
                      ? "Date et heure avec un titre générique."
                      : "Les notes, questions et décisions restent toujours privées."}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={() =>
                void update({
                  status: connection.status === "paused" ? "active" : "paused",
                })
              }
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryLabel}>
                {connection.status === "paused" ? "Reprendre" : "Mettre en pause"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={disconnect}
              style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
            >
              <Text style={styles.dangerLabel}>Déconnecter</Text>
            </Pressable>
          </View>
        ) : null}
        {status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
      </SectionCard>

      {conflicts.length > 0 ? (
        <SectionCard
          eyebrow="Action requise"
          title="Choisir sans écraser"
          description="Ces rendez-vous ont changé des deux côtés. Mood Day attend ton choix."
        >
          {conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflict}>
              <Text style={styles.choiceTitle}>
                {conflict.moodDay?.title ?? "Rendez-vous"}
              </Text>
              <Text style={styles.choiceDescription}>
                Google : {conflict.google?.deletedAt ? "supprimé" : conflict.google?.title ?? "modifié"}
              </Text>
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isPending}
                  onPress={() => void resolve(conflict, "moodday")}
                  style={({ pressed }) => [styles.smallPrimary, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryLabel}>Garder Mood Day</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isPending}
                  onPress={() => void resolve(conflict, "google")}
                  style={({ pressed }) => [styles.smallSecondary, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryLabel}>Garder Google</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: space[2], paddingBottom: space[2] },
  closeButton: { minWidth: 48, minHeight: 48, alignSelf: "flex-start", justifyContent: "center" },
  closeLabel: { color: color.primaryDeep, fontSize: 15, fontWeight: "700" },
  illustration: { width: 190, height: 122 },
  title: { color: color.ink, fontSize: 34, lineHeight: 40, fontWeight: "700" },
  subtitle: { maxWidth: 330, color: color.inkMuted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  stack: { gap: space[3] },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  body: { color: color.ink, fontSize: 16, lineHeight: 23, fontWeight: "600" },
  label: { color: color.ink, fontSize: 14, fontWeight: "700" },
  primaryButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.medium, backgroundColor: color.primary, paddingHorizontal: space[4] },
  primaryLabel: { color: color.surfaceStrong, fontSize: 15, fontWeight: "700" },
  secondaryButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.border, borderRadius: radius.medium, backgroundColor: color.surface },
  secondaryLabel: { color: color.primaryDeep, fontSize: 15, fontWeight: "700" },
  dangerButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.danger, borderRadius: radius.medium, backgroundColor: color.dangerSoft },
  dangerLabel: { color: color.danger, fontSize: 15, fontWeight: "700" },
  choice: { minHeight: 72, justifyContent: "center", gap: 4, borderWidth: 1, borderColor: color.border, borderRadius: radius.medium, backgroundColor: color.surface, padding: space[3] },
  choiceSelected: { borderColor: color.primary, backgroundColor: color.primarySoft },
  choiceTitle: { color: color.ink, fontSize: 15, fontWeight: "700" },
  choiceDescription: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  conflict: { gap: space[2], borderWidth: 1, borderColor: color.apricot, borderRadius: radius.medium, backgroundColor: color.surface, padding: space[3] },
  smallPrimary: { minHeight: 48, flexGrow: 1, alignItems: "center", justifyContent: "center", borderRadius: radius.medium, backgroundColor: color.primary, paddingHorizontal: space[3] },
  smallSecondary: { minHeight: 48, flexGrow: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.border, borderRadius: radius.medium, backgroundColor: color.surface, paddingHorizontal: space[3] },
  status: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

import { color, radius, space } from "@moodday/design-tokens";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { authClient } from "../../src/lib/auth-client";
import {
  getCachedCheckIns,
  getCachedDoseEvents,
  getCachedRoutineOccurrences,
  getLocalOperationSummary,
  synchronizeNow,
} from "../../src/lib/local-database";
import { buildWeeklyLandmarks } from "../../src/lib/landmarks";

type Summary = ReturnType<typeof buildWeeklyLandmarks>;
const localToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

export default function ReperesScreen() {
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [snapshot, setSnapshot] = useState<{
    ownerId: string;
    summary: Summary;
    pending: number;
  }>();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const summary = snapshot?.ownerId === ownerId ? snapshot?.summary : undefined;

  useFocusEffect(
    useCallback(() => {
      if (!ownerId) return;
      let active = true;
      setLoading(true);
      setStatus(attempt > 0 ? "Actualisation…" : undefined);
      const read = async () => {
        const [checkIns, doseEvents, routines, operations] = await Promise.all([
          getCachedCheckIns(ownerId),
          getCachedDoseEvents(ownerId),
          getCachedRoutineOccurrences(ownerId),
          getLocalOperationSummary(ownerId),
        ]);
        if (active)
          setSnapshot({
            ownerId,
            summary: buildWeeklyLandmarks({
              today: localToday(),
              checkIns,
              doseEvents,
              routines,
            }),
            pending: operations.total,
          });
      };
      const load = async () => {
        await read();
        try {
          await synchronizeNow(ownerId);
          await read();
          if (active)
            setStatus(
              "À jour · données de ton compte synchronisées sur cet appareil.",
            );
        } catch {
          if (active)
            setStatus(
              "Synchronisation indisponible · les données conservées sur cet appareil peuvent être incomplètes.",
            );
        }
      };
      void load()
        .catch(() => {
          if (active)
            setStatus(
              "Impossible de lire tes repères pour le moment. Tu peux réessayer.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [ownerId, attempt]),
  );

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.kicker}>COMPRENDRE SANS CONCLURE</Text>
        <Text style={styles.title}>Repères</Text>
        <BrandIllustration variant="landmarks" style={styles.visual} />
      </View>
      {loading ? (
        <ActivityIndicator
          color={color.primary}
          accessibilityLabel="Chargement des repères"
        />
      ) : null}
      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.caption}>
          {status}
        </Text>
      ) : null}
      {summary ? (
        <>
          <SectionCard
            eyebrow={`${summary.from} → ${summary.to}`}
            title="Tes sept derniers jours"
            description={`${summary.checkInCount} point(s) sur ${summary.days} jour(s), ${summary.dosesTaken} prise(s) renseignée(s) et ${summary.routinesCompleted} routine(s) accomplie(s). Aucun objectif de série.`}
          />
          <SectionCard
            title="Ce que ces données permettent de voir"
            description={`${summary.scoredDays} jour(s) avec les trois dimensions renseignées sur 7 (${summary.coverage} % de couverture). Une présence sans score reste une présence ; une journée sans mesure n’est jamais un zéro. Aucune corrélation n’est déduite de ce résumé.`}
          />
          {snapshot && snapshot.pending > 0 ? (
            <Text style={styles.caption}>
              {snapshot.pending} opération(s) locale(s) attendent une
              synchronisation ou une résolution dans les réglages.
            </Text>
          ) : null}
          {summary.timeline.length === 0 ? (
            <SectionCard
              title="Tes repères commencent avec toi."
              description="Aucun point enregistré sur cette période. Tu peux faire un point depuis Aujourd’hui, quand tu le souhaites."
            />
          ) : (
            summary.timeline.map((entry) => (
              <SectionCard
                key={entry.id}
                eyebrow={`${entry.localDate} · saisi par toi · ${entry.timezone}`}
                title={
                  entry.depth === "presence" ? "Je suis là" : "Point du jour"
                }
                description={
                  entry.depth === "presence"
                    ? "Présence enregistrée, sans score."
                    : `Moral ${entry.valence ?? "—"}/10 · Énergie ${entry.activation ?? "—"}/10 · Irritabilité ${entry.irritability ?? "—"}/10`
                }
              />
            ))
          )}
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => setAttempt((value) => value + 1)}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>Actualiser mes repères</Text>
      </Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: { gap: space[2] },
  kicker: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: { color: color.ink, fontSize: 38, lineHeight: 44, fontWeight: "700" },
  visual: { alignSelf: "center", width: 280, height: 126 },
  caption: { color: color.inkMuted, fontSize: 14, lineHeight: 21 },
  button: {
    minHeight: 48,
    padding: space[4],
    backgroundColor: color.surfaceStrong,
    borderRadius: radius.medium,
  },
  buttonLabel: {
    color: color.primary,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});

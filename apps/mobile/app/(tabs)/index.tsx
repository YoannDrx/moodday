import type { CreateCheckInInput } from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import * as Crypto from "expo-crypto";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { authClient } from "../../src/lib/auth-client";
import {
  flushPendingCheckIns,
  getPendingOperationCount,
  saveCheckInOfflineFirst,
} from "../../src/lib/local-database";

type CheckInMode = "idle" | "quick" | "done";
type CoreDimension = "valence" | "activation" | "irritability";
type Scores = Partial<Record<CoreDimension, number>>;

const scaleValues = [0, 2, 4, 6, 8, 10] as const;

const getLocalContext = () => {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    timezone,
    localDate: `${value("year")}-${value("month")}-${value("day")}`,
    dateLabel: new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: timezone,
    }).format(new Date()),
  };
};

export default function TodayScreen() {
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const context = useMemo(getLocalContext, []);
  const [mode, setMode] = useState<CheckInMode>("idle");
  const [scores, setScores] = useState<Scores>({});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [pendingCount, setPendingCount] = useState(0);

  const complete =
    scores.valence !== undefined &&
    scores.activation !== undefined &&
    scores.irritability !== undefined;

  useEffect(() => {
    if (!ownerId) return;
    const synchronize = async () => {
      await flushPendingCheckIns(ownerId);
      setPendingCount(await getPendingOperationCount(ownerId));
    };
    synchronize().catch(() => setStatus("Synchronisation en attente."));
  }, [ownerId]);

  const save = async (depth: "presence" | "quick") => {
    if (!ownerId) return;
    setIsSaving(true);
    setStatus(undefined);
    const input: CreateCheckInInput = {
      operationId: Crypto.randomUUID(),
      depth,
      localDate: context.localDate,
      timezone: context.timezone,
      contexts: [],
      ...(depth === "quick" ? scores : {}),
    };

    try {
      const result = await saveCheckInOfflineFirst(ownerId, input);
      setMode("done");
      setStatus(
        result.pending
          ? "Conservé sur cet appareil · synchronisation en attente"
          : "Synchronisé avec Mood Day",
      );
      setPendingCount(await getPendingOperationCount(ownerId));
    } catch {
      setStatus("Connexion nécessaire pour enregistrer ce point.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>
            {context.dateLabel.toLocaleUpperCase("fr-FR")}
          </Text>
          <Text style={styles.display}>Bonjour.</Text>
          <Text style={styles.subtitle}>
            Une seule chose suffit aujourd’hui.
          </Text>
        </View>
        <BrandIllustration variant="checkIn" style={styles.checkInVisual} />
      </View>

      <SectionCard
        eyebrow="Ton point du jour"
        title={mode === "done" ? "C’est noté." : "Comment est la journée ?"}
        description={
          mode === "done"
            ? "Tu as gardé le fil. Tu peux t’arrêter ici."
            : "10 à 20 secondes, ou simplement signaler ta présence."
        }
      >
        {mode === "idle" ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode("quick")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>Faire un point rapide</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void save("presence")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryLabel}>
                {isSaving ? "Enregistrement…" : "Je suis là"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {mode === "quick" ? (
          <View style={styles.dimensionList}>
            <DimensionScale
              label="Moral"
              hint="Du très lourd au très léger"
              value={scores.valence}
              onChange={(value) =>
                setScores((current) => ({ ...current, valence: value }))
              }
            />
            <DimensionScale
              label="Énergie"
              hint="Du ralenti à beaucoup d’élan"
              value={scores.activation}
              onChange={(value) =>
                setScores((current) => ({ ...current, activation: value }))
              }
            />
            <DimensionScale
              label="Irritabilité"
              hint="Du calme au très sensible"
              value={scores.irritability}
              onChange={(value) =>
                setScores((current) => ({ ...current, irritability: value }))
              }
            />
            <Text style={styles.help}>
              Aucune valeur n’est choisie à ta place.
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={!complete || isSaving}
              onPress={() => void save("quick")}
              style={({ pressed }) => [
                styles.primaryButton,
                (!complete || isSaving) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>
                {isSaving ? "Enregistrement…" : "Enregistrer mon point"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard
        eyebrow="Prochaine étape"
        title="Préparer le prochain rendez-vous"
        description="Ajoute tes questions au fil des jours, sans tout reconstruire au dernier moment."
      >
        <View style={styles.progressTrack}>
          <View style={styles.progressValue} />
        </View>
        <Text style={styles.progressLabel}>Préparation 2 sur 4</Text>
      </SectionCard>

      <SectionCard
        title="Les repères disponibles"
        description="Chaque donnée affichera sa source, sa couverture et son caractère partiel."
      />

      {pendingCount > 0 ? (
        <Text style={styles.pending}>
          {pendingCount} opération{pendingCount > 1 ? "s" : ""} en attente de
          synchronisation
        </Text>
      ) : null}
    </Screen>
  );
}

function DimensionScale({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value?: number;
  onChange: (value: number) => void;
}) {
  return (
    <View
      accessible
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.dimensionGroup}
    >
      <Text style={styles.dimensionLabel}>{label}</Text>
      <Text style={styles.dimensionHint}>{hint}</Text>
      <View style={styles.scale}>
        {scaleValues.map((scaleValue) => {
          const selected = value === scaleValue;
          return (
            <Pressable
              key={scaleValue}
              accessibilityRole="radio"
              accessibilityLabel={`${label}, ${scaleValue} sur 10`}
              accessibilityState={{ selected }}
              onPress={() => onChange(scaleValue)}
              style={({ pressed }) => [
                styles.scaleButton,
                selected && styles.scaleButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.scaleLabel,
                  selected && styles.scaleLabelSelected,
                ]}
              >
                {scaleValue}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    minHeight: 146,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    paddingVertical: space[4],
  },
  headingCopy: { flex: 1, gap: space[2] },
  checkInVisual: { width: 118, height: 118 },
  kicker: {
    color: color.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  display: {
    color: color.ink,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
  },
  subtitle: { color: color.inkMuted, fontSize: 17, lineHeight: 24 },
  actions: { gap: space[3] },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
    paddingHorizontal: space[4],
  },
  primaryLabel: {
    color: color.surfaceStrong,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: color.border,
  },
  secondaryLabel: { color: color.primaryDeep, fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  dimensionList: { gap: space[6] },
  dimensionGroup: { gap: space[2] },
  dimensionLabel: { color: color.ink, fontSize: 16, fontWeight: "700" },
  dimensionHint: { color: color.inkMuted, fontSize: 13 },
  scale: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space[1],
  },
  scaleButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.small,
    backgroundColor: color.surfaceStrong,
  },
  scaleButtonSelected: {
    borderColor: color.primary,
    backgroundColor: color.primary,
  },
  scaleLabel: { color: color.inkMuted, fontSize: 14, fontWeight: "700" },
  scaleLabelSelected: { color: color.surfaceStrong },
  help: { color: color.inkMuted, fontSize: 13, textAlign: "center" },
  status: {
    color: color.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.primarySoft,
  },
  progressValue: {
    width: "50%",
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.primary,
  },
  progressLabel: { color: color.inkMuted, fontSize: 13 },
  pending: { color: color.inkMuted, fontSize: 12, textAlign: "center" },
});

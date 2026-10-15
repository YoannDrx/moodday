import type { CreateCheckInInput } from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { authClient } from "../../src/lib/auth-client";
import {
  discardUserDraft,
  flushPendingCheckIns,
  getCachedUserDraft,
  getPendingOperationCount,
  refreshUserDraft,
  saveCheckInOfflineFirst,
  saveUserDraftLocally,
} from "../../src/lib/local-database";

type CheckInMode = "idle" | "quick" | "complete" | "done";
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
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [context, setContext] = useState(getLocalContext);
  const [mode, setMode] = useState<CheckInMode>("idle");
  const [scores, setScores] = useState<Scores>({});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [pendingCount, setPendingCount] = useState(0);
  const [anxiety, setAnxiety] = useState<number>();
  const [note, setNote] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const busy = useRef(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const draftWrite = useRef<Promise<void>>(Promise.resolve());

  const refreshIdleDay = useCallback(() => {
    // A point already being edited retains its declared day and timezone.
    if (
      isSaving ||
      busy.current ||
      !draftLoaded ||
      mode === "quick" ||
      mode === "complete"
    )
      return false;
    const next = getLocalContext();
    if (
      next.localDate === context.localDate &&
      next.timezone === context.timezone
    )
      return false;
    setDraftLoaded(false);
    setMode("idle");
    setScores({});
    setNote("");
    setContextNote("");
    setAnxiety(undefined);
    setStatus(undefined);
    setContext(next);
    return true;
  }, [context.localDate, context.timezone, draftLoaded, mode, isSaving]);

  useEffect(() => {
    refreshIdleDay();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshIdleDay();
    });
    const timer = setInterval(refreshIdleDay, 60_000);
    return () => {
      listener.remove();
      clearInterval(timer);
    };
  }, [refreshIdleDay]);

  const startPoint = () => {
    if (!draftLoaded || busy.current || refreshIdleDay()) return;
    setScores({});
    setNote("");
    setContextNote("");
    setAnxiety(undefined);
    setStatus(undefined);
    setMode("quick");
  };

  const complete =
    scores.valence !== undefined &&
    scores.activation !== undefined &&
    scores.irritability !== undefined;

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    const synchronize = async () => {
      await flushPendingCheckIns(ownerId);
      const count = await getPendingOperationCount(ownerId);
      if (active) setPendingCount(count);
    };
    synchronize().catch(() => {
      if (active) setStatus("Synchronisation en attente.");
    });
    return () => {
      active = false;
    };
  }, [ownerId]);

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    const restore = async () => {
      const cached = await getCachedUserDraft(
        ownerId,
        "check_in",
        context.localDate,
      );
      const draft =
        cached ??
        (await refreshUserDraft(ownerId, "check_in", context.localDate).catch(
          () => null,
        ));
      if (
        !active ||
        !draft ||
        !["quick", "complete"].includes(String(draft.content.mode))
      )
        return;
      const nextScores = draft.content.scores;
      if (!nextScores || typeof nextScores !== "object") return;
      const restored = Object.fromEntries(
        Object.entries(nextScores).filter(
          ([key, value]) =>
            ["valence", "activation", "irritability"].includes(key) &&
            typeof value === "number" &&
            Number.isInteger(value) &&
            value >= 0 &&
            value <= 10,
        ),
      ) as Scores;
      setScores(restored);
      setMode(draft.content.mode === "complete" ? "complete" : "quick");
      setNote(
        typeof draft.content.note === "string"
          ? draft.content.note.slice(0, 2000)
          : "",
      );
      setContextNote(
        typeof draft.content.contextNote === "string"
          ? draft.content.contextNote.slice(0, 48)
          : "",
      );
      const savedAnxiety = draft.content.anxiety;
      setAnxiety(
        typeof savedAnxiety === "number" &&
          Number.isInteger(savedAnxiety) &&
          savedAnxiety >= 0 &&
          savedAnxiety <= 10
          ? savedAnxiety
          : undefined,
      );
      setStatus("Ton brouillon est prêt, sans urgence à le terminer.");
    };
    void restore()
      .then(() => {
        if (active) setDraftLoaded(true);
      })
      .catch(() => {
        if (active)
          setStatus(
            "Le brouillon n’a pas pu être chargé. Réessaie avant de le remplacer.",
          );
      });
    return () => {
      active = false;
    };
  }, [context.localDate, context.timezone, ownerId, restoreAttempt]);

  useEffect(() => {
    if (!ownerId || !["quick", "complete"].includes(mode) || isSaving) return;
    const timeout = setTimeout(() => {
      draftWrite.current = draftWrite.current
        .then(async () => {
          const result = await saveUserDraftLocally(ownerId, {
            kind: "check_in",
            contextKey: context.localDate,
            content: {
              mode,
              scores,
              anxiety: anxiety ?? null,
              note,
              contextNote,
            },
          });
          if (result.pending) {
            setStatus("Brouillon conservé sur cet appareil.");
          }
        })
        .catch(() =>
          setStatus(
            "Le brouillon n’a pas pu être conservé. Garde cet écran ouvert et réessaie.",
          ),
        );
    }, 500);
    draftTimer.current = timeout;
    return () => clearTimeout(timeout);
  }, [
    context.localDate,
    mode,
    ownerId,
    scores,
    anxiety,
    note,
    contextNote,
    isSaving,
  ]);

  const save = async (depth: "presence" | "quick" | "complete") => {
    if (depth === "presence" && refreshIdleDay()) return;
    if (
      !ownerId ||
      !draftLoaded ||
      busy.current ||
      (depth !== "presence" && !complete)
    )
      return;
    busy.current = true;
    clearTimeout(draftTimer.current);
    setIsSaving(true);
    setStatus(undefined);
    const input: CreateCheckInInput = {
      operationId: Crypto.randomUUID(),
      depth,
      localDate: context.localDate,
      timezone: context.timezone,
      contexts:
        depth === "complete" && contextNote.trim() ? [contextNote.trim()] : [],
      ...(depth !== "presence" ? scores : {}),
      ...(depth === "complete" ? { anxiety, note: note.trim() || null } : {}),
    };

    try {
      await draftWrite.current;
      const result = await saveCheckInOfflineFirst(ownerId, input);
      await discardUserDraft(ownerId, "check_in", context.localDate).catch(
        () => undefined,
      );
      setMode("done");
      setStatus(
        result.pending
          ? "Conservé sur cet appareil · synchronisation en attente"
          : "Synchronisé avec Mood Day",
      );
      setPendingCount(
        await getPendingOperationCount(ownerId).catch(() => pendingCount),
      );
    } catch {
      setStatus(
        "Ce point n’a pas pu être confirmé. Tes réponses restent ici ; tu peux réessayer.",
      );
    } finally {
      setIsSaving(false);
      busy.current = false;
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les réglages du compte et de cet appareil"
        onPress={() => router.push("/settings")}
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.settingsButtonLabel}>Compte et appareil</Text>
        <Text accessibilityElementsHidden style={styles.settingsButtonGlyph}>
          →
        </Text>
      </Pressable>

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
              disabled={isSaving || !draftLoaded}
              onPress={startPoint}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>Faire un point rapide</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || !draftLoaded}
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

        {mode === "done" ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSaving || !draftLoaded}
            onPress={startPoint}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>Faire un autre point</Text>
          </Pressable>
        ) : null}

        {!draftLoaded ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setRestoreAttempt((value) => value + 1)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>
              Vérifier le brouillon avant de commencer
            </Text>
          </Pressable>
        ) : null}

        {mode === "quick" || mode === "complete" ? (
          <View style={styles.dimensionList}>
            <DimensionScale
              label="Moral"
              disabled={isSaving}
              hint="Du très lourd au très léger"
              value={scores.valence}
              onChange={(value) =>
                setScores((current) => ({ ...current, valence: value }))
              }
            />
            <DimensionScale
              label="Énergie"
              disabled={isSaving}
              hint="Du ralenti à beaucoup d’élan"
              value={scores.activation}
              onChange={(value) =>
                setScores((current) => ({ ...current, activation: value }))
              }
            />
            <DimensionScale
              label="Irritabilité"
              disabled={isSaving}
              hint="Du calme au très sensible"
              value={scores.irritability}
              onChange={(value) =>
                setScores((current) => ({ ...current, irritability: value }))
              }
            />
            <Text style={styles.help}>
              Aucune valeur n’est choisie à ta place.
            </Text>
            {mode === "quick" ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => setMode("complete")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryLabel}>
                  Ajouter du contexte, si tu veux
                </Text>
              </Pressable>
            ) : (
              <View style={styles.dimensionList}>
                <DimensionScale
                  label="Anxiété (facultatif)"
                  disabled={isSaving}
                  hint="Tu peux laisser cette question sans réponse."
                  value={anxiety}
                  onChange={setAnxiety}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={() => setAnxiety(undefined)}
                >
                  <Text style={styles.secondaryLabel}>
                    Ne pas renseigner l’anxiété
                  </Text>
                </Pressable>
                <TextInput
                  accessibilityLabel="Contexte (facultatif)"
                  placeholder="Un repère de contexte, si utile"
                  value={contextNote}
                  onChangeText={setContextNote}
                  maxLength={48}
                  editable={!isSaving}
                  style={styles.textInput}
                />
                <TextInput
                  accessibilityLabel="Note privée (facultatif)"
                  placeholder="Une note pour toi"
                  value={note}
                  onChangeText={setNote}
                  maxLength={2000}
                  multiline
                  editable={!isSaving}
                  style={styles.textInput}
                />
                <Text style={styles.help}>
                  Ta note reste privée. Ces compléments sont facultatifs.
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={!complete || isSaving}
              onPress={() =>
                void save(mode === "complete" ? "complete" : "quick")
              }
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
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || !ownerId}
              onPress={() => {
                if (!ownerId || busy.current) return;
                busy.current = true;
                setIsSaving(true);
                clearTimeout(draftTimer.current);
                void draftWrite.current
                  .then(async () =>
                    discardUserDraft(ownerId, "check_in", context.localDate),
                  )
                  .then(() => {
                    setScores({});
                    setNote("");
                    setContextNote("");
                    setAnxiety(undefined);
                    setMode("idle");
                    setStatus("Brouillon effacé.");
                  })
                  .catch(() =>
                    setStatus(
                      "Le brouillon n’a pas été effacé. Tes réponses restent ici.",
                    ),
                  )
                  .finally(() => {
                    busy.current = false;
                    setIsSaving(false);
                  });
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryLabel}>Annuler ce brouillon</Text>
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
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/soin")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>Voir mes rendez-vous</Text>
        </Pressable>
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
  disabled = false,
}: {
  label: string;
  hint: string;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
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
              disabled={disabled}
              accessibilityLabel={`${label}, ${scaleValue} sur 10`}
              accessibilityState={{ selected, disabled }}
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
  settingsButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[4],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
  },
  settingsButtonLabel: {
    color: color.primaryDeep,
    fontSize: 15,
    fontWeight: "700",
  },
  settingsButtonGlyph: { color: color.primary, fontSize: 20 },
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
  textInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.small,
    padding: space[3],
    color: color.ink,
    fontSize: 16,
  },
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
  pending: { color: color.inkMuted, fontSize: 12, textAlign: "center" },
});

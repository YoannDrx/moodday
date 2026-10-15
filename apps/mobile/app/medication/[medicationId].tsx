import type {
  DoseEventDto,
  EffectiveDoseEventKind,
  MedicationDetailDto,
  MedicationInventoryReason,
} from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { api } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";
import {
  cacheMedicationDetail,
  getCachedMedicationDetail,
  saveDoseEventCorrectionOfflineFirst,
  saveMedicationInventoryAdjustmentOfflineFirst,
} from "../../src/lib/local-database";

const kindLabel: Record<EffectiveDoseEventKind, string> = {
  taken: "prise",
  skipped: "passée",
  prn: "au besoin",
  cancelled: "annulée",
};

const eventLabel = (event: DoseEventDto) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  }).format(new Date(event.occurredAt));

const adjustmentReasons: readonly {
  id: MedicationInventoryReason;
  label: string;
}[] = [
  { id: "refill", label: "Réapprovisionnement" },
  { id: "correction", label: "Correction" },
  { id: "manual", label: "Autre ajustement" },
];

export default function MedicationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ medicationId: string }>();
  const medicationId = params.medicationId;
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [detail, setDetail] = useState<MedicationDetailDto>();
  const [selectedEvent, setSelectedEvent] = useState<DoseEventDto>();
  const [correctionReason, setCorrectionReason] = useState("");
  const [inventoryDelta, setInventoryDelta] = useState("");
  const [inventoryReason, setInventoryReason] =
    useState<MedicationInventoryReason>("refill");
  const [inventoryNote, setInventoryNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>();

  const load = useCallback(async () => {
    if (!ownerId || !medicationId) return;
    const cached = await getCachedMedicationDetail(ownerId, medicationId);
    if (cached) {
      setDetail(cached);
      setStatus("Historique disponible hors ligne sur cet iPhone.");
    }
    try {
      const remote = await api.getMedicationDetail(medicationId);
      await cacheMedicationDetail(ownerId, remote);
      setDetail(remote);
      setStatus("Historique à jour.");
    } catch {
      setStatus(
        cached
          ? "Hors ligne · la dernière version chiffrée reste disponible."
          : "Ce traitement est momentanément indisponible.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [medicationId, ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const correctionTargets = useMemo(() => {
    if (!selectedEvent) return [];
    return selectedEvent.kind === "prn"
      ? (["prn", "cancelled"] as const)
      : (["taken", "skipped", "cancelled"] as const);
  }, [selectedEvent]);

  const correct = async (targetKind: EffectiveDoseEventKind) => {
    if (!ownerId || !detail || !selectedEvent) return;
    if (!correctionReason.trim()) {
      setStatus("Indique brièvement pourquoi tu corriges cette prise.");
      return;
    }
    setIsPending(true);
    setStatus("Correction sécurisée en cours…");
    try {
      const result = await saveDoseEventCorrectionOfflineFirst(
        ownerId,
        selectedEvent,
        {
          doseEventId: selectedEvent.id,
          targetKind,
          occurredAt: selectedEvent.occurredAt,
          timezone: selectedEvent.timezone,
          note: selectedEvent.note,
          reason: correctionReason.trim(),
          baseVersion: selectedEvent.updatedAt,
        },
      );
      const nextDetail: MedicationDetailDto = {
        ...detail,
        doseEvents: detail.doseEvents.map((event) =>
          event.id === result.event.id ? result.event : event,
        ),
        corrections: [result.correction, ...detail.corrections],
      };
      await cacheMedicationDetail(ownerId, nextDetail);
      setDetail(nextDetail);
      setSelectedEvent(undefined);
      setCorrectionReason("");
      setStatus(
        result.pending
          ? "Correction conservée sur cet iPhone · synchronisation en attente."
          : "Correction enregistrée dans l’historique.",
      );
    } catch {
      setStatus(
        "La correction n’a pas abouti. La prise précédente reste intacte.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const adjustInventory = async () => {
    if (!ownerId || !detail) return;
    const quantityDelta = Number(inventoryDelta.replace(",", "."));
    if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
      setStatus("Saisis une quantité positive ou négative différente de zéro.");
      return;
    }
    setIsPending(true);
    setStatus("Ajustement du stock…");
    try {
      const result = await saveMedicationInventoryAdjustmentOfflineFirst(
        ownerId,
        detail.medication,
        {
          medicationId: detail.medication.id,
          quantityDelta,
          reason: inventoryReason,
          occurredAt: new Date().toISOString(),
          note: inventoryNote.trim() || null,
          baseVersion: detail.medication.updatedAt,
        },
      );
      const nextDetail: MedicationDetailDto = {
        ...detail,
        medication: result.medication,
        inventoryEvents: [result.inventoryEvent, ...detail.inventoryEvents],
      };
      await cacheMedicationDetail(ownerId, nextDetail);
      setDetail(nextDetail);
      setInventoryDelta("");
      setInventoryNote("");
      setStatus(
        result.pending
          ? "Ajustement conservé sur cet iPhone · synchronisation en attente."
          : "Stock ajusté et événement d’inventaire conservé.",
      );
    } catch {
      setStatus("Ajustement impossible. Le stock précédent reste inchangé.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le détail du traitement"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
        <BrandIllustration variant="treatment" style={styles.illustration} />
        <Text style={styles.title}>
          {detail?.medication.name ?? "Traitement"}
        </Text>
        <Text style={styles.subtitle}>
          {detail
            ? `${detail.medication.dosage} · ${detail.medication.frequency.replaceAll("_", " ")}`
            : "Chargement du repère…"}
        </Text>
      </View>

      {isLoading && !detail ? (
        <ActivityIndicator color={color.primary} />
      ) : null}

      {detail ? (
        <>
          <ActionButton
            disabled={isPending}
            label="Modifier le traitement ou son régime"
            onPress={() =>
              router.push({
                pathname: "/medication/[medicationId]/edit",
                params: { medicationId: detail.medication.id },
              })
            }
            secondary
          />
          <SectionCard
            eyebrow="Stock déclaré"
            title={
              detail.medication.stockQuantity === null
                ? "Stock non suivi"
                : `${detail.medication.stockQuantity} unité${detail.medication.stockQuantity > 1 ? "s" : ""}`
            }
            description="Ce suivi est un repère personnel et ne remplace jamais le conseil d’un pharmacien."
          >
            <TextInput
              accessibilityLabel="Quantité à ajouter ou retirer"
              editable={!isPending}
              keyboardType="decimal-pad"
              onChangeText={setInventoryDelta}
              placeholder="Ex. 30 ou -2"
              placeholderTextColor={color.inkMuted}
              style={styles.input}
              value={inventoryDelta}
            />
            <View style={styles.choiceRow}>
              {adjustmentReasons.map((reason) => (
                <Pressable
                  key={reason.id}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: inventoryReason === reason.id,
                  }}
                  onPress={() => setInventoryReason(reason.id)}
                  style={({ pressed }) => [
                    styles.choice,
                    inventoryReason === reason.id && styles.choiceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.choiceLabel}>{reason.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              accessibilityLabel="Note facultative sur l’ajustement"
              editable={!isPending}
              maxLength={500}
              onChangeText={setInventoryNote}
              placeholder="Note facultative"
              placeholderTextColor={color.inkMuted}
              style={styles.input}
              value={inventoryNote}
            />
            <ActionButton
              disabled={isPending}
              label="Enregistrer l’ajustement"
              onPress={() => void adjustInventory()}
            />
          </SectionCard>

          <SectionCard
            eyebrow="Historique des prises"
            title={`${detail.doseEvents.length} événement${detail.doseEvents.length > 1 ? "s" : ""} récent${detail.doseEvents.length > 1 ? "s" : ""}`}
            description="Une correction ajoute une trace datée. Elle n’efface jamais silencieusement l’historique."
          >
            {detail.doseEvents.length === 0 ? (
              <Text style={styles.empty}>Aucune prise enregistrée.</Text>
            ) : null}
            {detail.doseEvents.slice(0, 30).map((event) => (
              <Pressable
                key={event.id}
                accessibilityRole="button"
                accessibilityLabel={`Corriger la prise du ${eventLabel(event)}`}
                disabled={isPending}
                onPress={() => {
                  setSelectedEvent(event);
                  setCorrectionReason("");
                }}
                style={({ pressed }) => [
                  styles.historyRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>
                    {eventLabel(event)} · {kindLabel[event.kind]}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {event.correctionCount > 0
                      ? `${event.correctionCount} correction${event.correctionCount > 1 ? "s" : ""}`
                      : "Événement initial"}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </SectionCard>

          {selectedEvent ? (
            <SectionCard
              eyebrow="Correction explicite"
              title={eventLabel(selectedEvent)}
              description="Choisis le nouvel état et indique un motif. En cas de conflit multi-appareils, Mood Day te demandera d’actualiser."
            >
              <TextInput
                accessibilityLabel="Motif de correction"
                editable={!isPending}
                maxLength={500}
                onChangeText={setCorrectionReason}
                placeholder="Pourquoi cette correction ?"
                placeholderTextColor={color.inkMuted}
                style={styles.input}
                value={correctionReason}
              />
              <View style={styles.stack}>
                {correctionTargets.map((target) => (
                  <ActionButton
                    key={target}
                    disabled={isPending}
                    label={`Marquer comme ${kindLabel[target]}`}
                    onPress={() => void correct(target)}
                    secondary={target !== "cancelled"}
                  />
                ))}
                <ActionButton
                  disabled={isPending}
                  label="Ne rien modifier"
                  onPress={() => setSelectedEvent(undefined)}
                  secondary
                />
              </View>
            </SectionCard>
          ) : null}

          <SectionCard
            eyebrow="Journal d’inventaire"
            title="Mouvements récents"
            description="Les prises et corrections de stock restent distinguées."
          >
            {detail.inventoryEvents.slice(0, 30).map((event) => (
              <View key={event.id} style={styles.historyRow}>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>
                    {event.quantityDelta > 0 ? "+" : ""}
                    {event.quantityDelta} · {event.reason}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {new Date(event.occurredAt).toLocaleDateString("fr-FR")}
                    {event.note ? ` · ${event.note}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>
        </>
      ) : null}

      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
      ) : null}
    </Screen>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
  secondary = false,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.actionLabel, secondary && styles.actionLabelSecondary]}
      >
        {label}
      </Text>
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
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: color.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
    color: color.ink,
    fontSize: 15,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  choiceRow: { gap: space[2] },
  choice: {
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    paddingHorizontal: space[3],
  },
  choiceSelected: {
    borderColor: color.primary,
    backgroundColor: color.primarySoft,
  },
  choiceLabel: { color: color.ink, fontSize: 14, fontWeight: "700" },
  historyRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingVertical: space[2],
  },
  historyCopy: { flex: 1, gap: space[1] },
  historyTitle: { color: color.ink, fontSize: 14, fontWeight: "700" },
  historyMeta: { color: color.inkMuted, fontSize: 12, lineHeight: 17 },
  chevron: { color: color.primary, fontSize: 26 },
  empty: { color: color.inkMuted, fontSize: 14 },
  stack: { gap: space[2] },
  action: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
    paddingHorizontal: space[3],
  },
  actionSecondary: {
    borderWidth: 1,
    borderColor: color.sage,
    backgroundColor: color.primarySoft,
  },
  actionLabel: {
    color: color.surfaceStrong,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  actionLabelSecondary: { color: color.primaryDeep },
  status: {
    color: color.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

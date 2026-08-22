import type {
  AppointmentDto,
  DoseEventDto,
  DoseEventKind,
  MedicationDto,
  RoutineDto,
  RoutineOccurrenceDto,
} from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import { useFocusEffect, useRouter } from "expo-router";
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
  getCachedAppointments,
  getCachedDoseEvents,
  getCachedMedications,
  getCachedRoutineOccurrences,
  getCachedRoutines,
  refreshTreatmentSnapshots,
  saveDoseEventOfflineFirst,
  saveRoutineOccurrenceOfflineFirst,
  synchronizeNow,
} from "../../src/lib/local-database";

type MedicationDoseSlot = {
  key: string;
  doseIndex: number | null;
  kind: DoseEventKind;
  label: string;
};

const getMedicationDoseSlots = (
  medication: MedicationDto,
  localDate: string,
): MedicationDoseSlot[] => {
  if (medication.isPrn) {
    return [
      {
        key: `${medication.id}:prn`,
        doseIndex: null,
        kind: "prn",
        label: "Au besoin",
      },
    ];
  }
  if (
    medication.frequency === "weekly" &&
    medication.weeklyDay !== new Date(`${localDate}T12:00:00.000Z`).getUTCDay()
  ) {
    return [];
  }
  const count = medication.frequency === "twice_daily" ? 2 : 1;
  return Array.from({ length: count }, (_, doseIndex) => ({
    key: `${medication.id}:${localDate}:${doseIndex}`,
    doseIndex,
    kind: "taken" as const,
    label:
      medication.scheduleTimes[doseIndex] ??
      (doseIndex === 0 ? "Dans la journée" : "Deuxième prise"),
  }));
};

const appointmentLabel = (appointment: AppointmentDto) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: appointment.timezone,
  }).format(new Date(appointment.startsAt));

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
  };
};

export default function CareScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [routines, setRoutines] = useState<RoutineDto[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrenceDto[]>([]);
  const [medications, setMedications] = useState<MedicationDto[]>([]);
  const [doseEvents, setDoseEvents] = useState<DoseEventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [savingRoutineId, setSavingRoutineId] = useState<string>();
  const [routineStatus, setRoutineStatus] = useState<string>();
  const [savingDoseKey, setSavingDoseKey] = useState<string>();
  const [doseStatus, setDoseStatus] = useState<string>();
  const [localContext] = useState(getLocalContext);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setIsLoading(true);
    const [
      cachedAppointments,
      cachedRoutines,
      cachedOccurrences,
      cachedMedications,
      cachedDoseEvents,
    ] = await Promise.all([
      getCachedAppointments(ownerId),
      getCachedRoutines(ownerId),
      getCachedRoutineOccurrences(ownerId),
      getCachedMedications(ownerId),
      getCachedDoseEvents(ownerId),
    ]);
    setAppointments(cachedAppointments);
    setRoutines(cachedRoutines);
    setOccurrences(cachedOccurrences);
    setMedications(cachedMedications);
    setDoseEvents(cachedDoseEvents);
    try {
      await synchronizeNow(ownerId);
      await refreshTreatmentSnapshots(
        ownerId,
        localContext.localDate,
        localContext.timezone,
      );
      const [
        freshAppointments,
        freshRoutines,
        freshOccurrences,
        freshMedications,
        freshDoseEvents,
      ] = await Promise.all([
        getCachedAppointments(ownerId),
        getCachedRoutines(ownerId),
        getCachedRoutineOccurrences(ownerId),
        getCachedMedications(ownerId),
        getCachedDoseEvents(ownerId),
      ]);
      setAppointments(freshAppointments);
      setRoutines(freshRoutines);
      setOccurrences(freshOccurrences);
      setMedications(freshMedications);
      setDoseEvents(freshDoseEvents);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [localContext.localDate, localContext.timezone, ownerId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const nextAppointment = appointments
    .filter(
      (appointment) =>
        appointment.status === "scheduled" &&
        new Date(appointment.startsAt).getTime() >= Date.now(),
    )
    .sort(
      (first, second) =>
        new Date(first.startsAt).getTime() -
        new Date(second.startsAt).getTime(),
    )[0];
  const activeRoutines = routines.filter(
    (routine) => routine.status === "active",
  );
  const todayOccurrences = occurrences.filter(
    (occurrence) => occurrence.localDate === localContext.localDate,
  );
  const activeMedications = medications.filter((medication) => {
    if (medication.isArchived) return false;
    if (medication.startDate && medication.startDate > localContext.localDate)
      return false;
    return !medication.endDate || medication.endDate >= localContext.localDate;
  });

  const recordDose = async (
    medication: MedicationDto,
    slot: MedicationDoseSlot,
    kind: DoseEventKind,
  ) => {
    if (!ownerId) return;
    setSavingDoseKey(slot.key);
    setDoseStatus(undefined);
    try {
      const result = await saveDoseEventOfflineFirst(ownerId, {
        medicationId: medication.id,
        kind,
        localDate: localContext.localDate,
        timezone: localContext.timezone,
        occurredAt: new Date().toISOString(),
        doseIndex: slot.doseIndex,
      });
      setDoseEvents((current) => [result.event, ...current]);
      setDoseStatus(
        result.pending
          ? "Noté sur cet appareil · synchronisation en attente"
          : kind === "skipped"
            ? "Prise indiquée comme passée"
            : "Prise notée",
      );
    } catch {
      setDoseStatus("Impossible de noter cette prise. Rien n’a été effacé.");
    } finally {
      setSavingDoseKey(undefined);
    }
  };

  const completeRoutine = async (routine: RoutineDto) => {
    if (!ownerId) return;
    setSavingRoutineId(routine.id);
    setRoutineStatus(undefined);
    try {
      const result = await saveRoutineOccurrenceOfflineFirst(ownerId, {
        routineId: routine.id,
        localDate: localContext.localDate,
        timezone: localContext.timezone,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      setOccurrences((current) => [
        result.occurrence,
        ...current.filter(
          (occurrence) =>
            !(
              occurrence.routineId === routine.id &&
              occurrence.localDate === localContext.localDate
            ),
        ),
      ]);
      setRoutineStatus(
        result.pending
          ? "Noté sur cet appareil · synchronisation en attente"
          : "Routine notée pour aujourd’hui",
      );
    } catch {
      setRoutineStatus(
        "Impossible de noter cette routine. Rien n’a été effacé.",
      );
    } finally {
      setSavingRoutineId(undefined);
    }
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>GARDER LE FIL DU SOIN</Text>
          <Text style={styles.title}>Soin</Text>
          <Text style={styles.subtitle}>
            Rendez-vous, traitements et habitudes réunis au même endroit.
          </Text>
        </View>
        <BrandIllustration
          variant="appointment"
          style={styles.appointmentVisual}
        />
      </View>

      {isOffline ? (
        <View accessibilityRole="alert" style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Hors ligne · les derniers éléments conservés sur cet appareil
            restent disponibles.
          </Text>
        </View>
      ) : null}

      <SectionCard
        eyebrow="Prochain rendez-vous"
        title={nextAppointment?.title ?? "Aucun rendez-vous prévu"}
        description={
          nextAppointment
            ? `${appointmentLabel(nextAppointment)}${nextAppointment.location ? ` · ${nextAppointment.location}` : ""}`
            : "Ajoute-le maintenant, puis prépare tes questions au fil des jours."
        }
      >
        {nextAppointment ? (
          <>
            <Text style={styles.meta}>
              Préparation ·{" "}
              {nextAppointment.preparationStatus.replaceAll("_", " ")}
            </Text>
            <ActionButton
              label="Préparer ce rendez-vous"
              onPress={() =>
                router.push({
                  pathname: "/appointment/[appointmentId]",
                  params: { appointmentId: nextAppointment.id },
                })
              }
            />
          </>
        ) : null}
        <ActionButton
          label="Ajouter un rendez-vous"
          onPress={() => router.push("/appointment-new")}
          secondary={Boolean(nextAppointment)}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Routines souples"
        title={
          activeRoutines.length === 0
            ? "Aucune routine à maintenir"
            : `${activeRoutines.length} repère${activeRoutines.length > 1 ? "s" : ""} choisi${activeRoutines.length > 1 ? "s" : ""}`
        }
        description={
          activeRoutines.length === 0
            ? "Une intention hebdomadaire, sans série ni retard à rattraper."
            : activeRoutines
                .slice(0, 3)
                .map((routine) => routine.title)
                .join(" · ")
        }
      >
        {activeRoutines.map((routine) => {
          const occurrence = todayOccurrences.find(
            (item) => item.routineId === routine.id,
          );
          const completed = occurrence?.status === "completed";
          return (
            <View key={routine.id} style={styles.routineRow}>
              <View style={styles.routineCopy}>
                <Text style={styles.routineTitle}>{routine.title}</Text>
                <Text style={styles.routineMeta}>
                  {completed
                    ? "Fait aujourd’hui · tu peux t’arrêter là"
                    : "À ton rythme, sans série à préserver"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Marquer ${routine.title} comme fait aujourd’hui`}
                accessibilityState={{ checked: completed, disabled: completed }}
                disabled={completed || savingRoutineId === routine.id}
                onPress={() => void completeRoutine(routine)}
                style={({ pressed }) => [
                  styles.routineToggle,
                  completed && styles.routineToggleCompleted,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.routineToggleLabel,
                    completed && styles.routineToggleLabelCompleted,
                  ]}
                >
                  {savingRoutineId === routine.id
                    ? "…"
                    : completed
                      ? "✓"
                      : "Fait"}
                </Text>
              </Pressable>
            </View>
          );
        })}
        {routineStatus ? (
          <Text accessibilityLiveRegion="polite" style={styles.routineStatus}>
            {routineStatus}
          </Text>
        ) : null}
        <ActionButton
          label="Créer une routine"
          onPress={() => router.push("/routine-new")}
          secondary
        />
      </SectionCard>

      <SectionCard
        eyebrow="Traitements"
        title={
          activeMedications.length === 0
            ? "Aucun traitement déclaré"
            : `${activeMedications.length} traitement${activeMedications.length > 1 ? "s" : ""} actif${activeMedications.length > 1 ? "s" : ""}`
        }
        description={
          activeMedications.length === 0
            ? "Tu peux continuer sans traitement. Rien n’est requis pour utiliser Mood Day."
            : "Les prises sont enregistrées sans jugement et restent disponibles hors ligne."
        }
      >
        {activeMedications.flatMap((medication) =>
          getMedicationDoseSlots(medication, localContext.localDate).map(
            (slot) => {
              const matchingEvents = doseEvents.filter(
                (event) =>
                  event.medicationId === medication.id &&
                  event.localDate === localContext.localDate &&
                  (slot.kind === "prn" || event.doseIndex === slot.doseIndex),
              );
              const event = slot.kind === "prn" ? undefined : matchingEvents[0];
              const resolved = Boolean(event);
              return (
                <View key={slot.key} style={styles.doseRow}>
                  <View style={styles.routineCopy}>
                    <Text style={styles.routineTitle}>{medication.name}</Text>
                    <Text style={styles.routineMeta}>
                      {medication.dosage} · {slot.label}
                      {slot.kind === "prn" && matchingEvents.length > 0
                        ? ` · ${matchingEvents.length} prise${matchingEvents.length > 1 ? "s" : ""} aujourd’hui`
                        : event
                          ? event.kind === "skipped"
                            ? " · passée"
                            : " · prise"
                          : ""}
                    </Text>
                  </View>
                  <View style={styles.doseActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Noter la prise de ${medication.name}`}
                      disabled={resolved || savingDoseKey === slot.key}
                      onPress={() =>
                        void recordDose(
                          medication,
                          slot,
                          slot.kind === "prn" ? "prn" : "taken",
                        )
                      }
                      style={({ pressed }) => [
                        styles.doseAction,
                        resolved && styles.doseActionResolved,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.doseActionLabel}>
                        {savingDoseKey === slot.key
                          ? "…"
                          : resolved
                            ? event?.kind === "skipped"
                              ? "Passée"
                              : "✓"
                            : slot.kind === "prn"
                              ? "Noter"
                              : "Prise"}
                      </Text>
                    </Pressable>
                    {slot.kind !== "prn" && !resolved ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Passer la prise de ${medication.name}`}
                        disabled={savingDoseKey === slot.key}
                        onPress={() =>
                          void recordDose(medication, slot, "skipped")
                        }
                        style={({ pressed }) => [
                          styles.doseSkip,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.doseSkipLabel}>Passer</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            },
          ),
        )}
        {doseStatus ? (
          <Text accessibilityLiveRegion="polite" style={styles.routineStatus}>
            {doseStatus}
          </Text>
        ) : null}
      </SectionCard>
      <SectionCard
        title="Plan de sécurité"
        description="Disponible sur cet appareil, même hors ligne. Les ressources de crise restent toujours prioritaires."
      />

      {isLoading ? (
        <View
          accessibilityLabel="Synchronisation en cours"
          style={styles.loading}
        >
          <ActivityIndicator color={color.primary} />
          <Text style={styles.loadingText}>Mise à jour des repères…</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
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
  heading: {
    minHeight: 142,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    marginBottom: space[2],
  },
  headingCopy: { flex: 1, gap: space[2] },
  appointmentVisual: { width: 112, height: 124 },
  kicker: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { color: color.ink, fontSize: 38, lineHeight: 44, fontWeight: "700" },
  subtitle: { color: color.inkMuted, fontSize: 16, lineHeight: 23 },
  offlineBanner: {
    padding: space[3],
    borderRadius: radius.medium,
    backgroundColor: color.apricot,
  },
  offlineText: { color: color.ink, fontSize: 13, lineHeight: 19 },
  meta: { color: color.primaryDeep, fontSize: 13, fontWeight: "700" },
  routineRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[2],
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  routineCopy: { flex: 1, gap: space[1] },
  routineTitle: { color: color.ink, fontSize: 15, fontWeight: "700" },
  routineMeta: { color: color.inkMuted, fontSize: 12, lineHeight: 17 },
  routineToggle: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.primary,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
  },
  routineToggleCompleted: {
    borderColor: color.sage,
    backgroundColor: color.primarySoft,
  },
  routineToggleLabel: {
    color: color.primaryDeep,
    fontSize: 14,
    fontWeight: "800",
  },
  routineToggleLabelCompleted: { fontSize: 20 },
  routineStatus: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  doseRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    paddingVertical: space[2],
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  doseActions: { flexDirection: "row", alignItems: "center", gap: space[1] },
  doseAction: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[2],
    borderRadius: radius.medium,
    backgroundColor: color.primary,
  },
  doseActionResolved: { backgroundColor: color.primarySoft },
  doseActionLabel: {
    color: color.surfaceStrong,
    fontSize: 13,
    fontWeight: "800",
  },
  doseSkip: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[2],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
  },
  doseSkipLabel: { color: color.inkMuted, fontSize: 12, fontWeight: "700" },
  action: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.primary,
  },
  actionSecondary: {
    backgroundColor: color.primarySoft,
    borderWidth: 1,
    borderColor: color.sage,
  },
  actionLabel: { color: color.surfaceStrong, fontSize: 15, fontWeight: "800" },
  actionLabelSecondary: { color: color.primaryDeep },
  pressed: { opacity: 0.72 },
  loading: { flexDirection: "row", justifyContent: "center", gap: space[2] },
  loadingText: { color: color.inkMuted, fontSize: 13 },
});

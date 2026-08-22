import type {
  AppointmentDto,
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
  getCachedRoutineOccurrences,
  getCachedRoutines,
  saveRoutineOccurrenceOfflineFirst,
  synchronizeNow,
} from "../../src/lib/local-database";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [savingRoutineId, setSavingRoutineId] = useState<string>();
  const [routineStatus, setRoutineStatus] = useState<string>();
  const [localContext] = useState(getLocalContext);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setIsLoading(true);
    const [cachedAppointments, cachedRoutines, cachedOccurrences] =
      await Promise.all([
        getCachedAppointments(ownerId),
        getCachedRoutines(ownerId),
        getCachedRoutineOccurrences(ownerId),
      ]);
    setAppointments(cachedAppointments);
    setRoutines(cachedRoutines);
    setOccurrences(cachedOccurrences);
    try {
      await synchronizeNow(ownerId);
      const [freshAppointments, freshRoutines, freshOccurrences] =
        await Promise.all([
          getCachedAppointments(ownerId),
          getCachedRoutines(ownerId),
          getCachedRoutineOccurrences(ownerId),
        ]);
      setAppointments(freshAppointments);
      setRoutines(freshRoutines);
      setOccurrences(freshOccurrences);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

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
        title="Traitements"
        description="Les prises, corrections, PRN et stocks de la V1 restent accessibles pendant leur raccordement aux contrats V2."
      />
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

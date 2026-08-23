import type { AppointmentDto } from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import * as Calendar from "expo-calendar";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandIllustration } from "../src/components/brand-illustration";
import { Screen } from "../src/components/screen";
import { SectionCard } from "../src/components/section-card";
import { authClient } from "../src/lib/auth-client";
import {
  getCachedAppointments,
  saveAppointmentOfflineFirst,
} from "../src/lib/local-database";

const dateValue = (value: string | Date) => new Date(value);

const eventLabel = (event: Calendar.Event) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateValue(event.startDate));

const isDuplicate = (
  event: Calendar.Event,
  appointments: readonly AppointmentDto[],
) =>
  appointments.some(
    (appointment) =>
      appointment.title.trim().toLocaleLowerCase("fr") ===
        event.title.trim().toLocaleLowerCase("fr") &&
      Math.abs(
        new Date(appointment.startsAt).getTime() -
          dateValue(event.startDate).getTime(),
      ) < 60_000,
  );

export default function NativeCalendarImportScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [events, setEvents] = useState<Calendar.Event[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<string>();

  const load = useCallback(async () => {
    if (!ownerId) return;
    setIsLoading(true);
    try {
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (!permission.granted) {
        setStatus(
          "Permission refusée. Le reste de Mood Day continue de fonctionner normalement.",
        );
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 120);
      const [calendarEvents, cachedAppointments] = await Promise.all([
        Calendar.getEventsAsync(
          calendars.map((calendar) => calendar.id),
          start,
          end,
        ),
        getCachedAppointments(ownerId),
      ]);
      setEvents(
        calendarEvents
          .filter((event) => Boolean(event.title.trim()) && !event.allDay)
          .sort(
            (left, right) =>
              dateValue(left.startDate).getTime() -
              dateValue(right.startDate).getTime(),
          )
          .slice(0, 100),
      );
      setAppointments(cachedAppointments);
    } catch {
      setStatus("Le calendrier iPhone est momentanément indisponible.");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const importEvent = async (event: Calendar.Event) => {
    if (!ownerId) return;
    if (isDuplicate(event, appointments)) {
      setStatus("Ce rendez-vous semble déjà présent dans Mood Day.");
      return;
    }
    setIsPending(true);
    setStatus(undefined);
    try {
      const eventTimezone = event.timeZone.trim();
      const timezone =
        eventTimezone === ""
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : eventTimezone;
      const location = event.location?.trim();
      const result = await saveAppointmentOfflineFirst(ownerId, {
        title: event.title.trim(),
        startsAt: dateValue(event.startDate).toISOString(),
        endsAt: event.endDate ? dateValue(event.endDate).toISOString() : null,
        timezone,
        location: location === "" ? null : (location ?? null),
        status: "scheduled",
        source: "native_calendar",
        preparationStatus: "not_started",
      });
      setStatus(
        result.pending
          ? "Rendez-vous importé sur cet iPhone · synchronisation en attente."
          : "Rendez-vous importé dans Mood Day.",
      );
      setAppointments((current) => [
        ...current,
        {
          id: result.entityId,
          title: event.title.trim(),
          startsAt: dateValue(event.startDate).toISOString(),
          endsAt: event.endDate ? dateValue(event.endDate).toISOString() : null,
          timezone,
          location: location === "" ? null : (location ?? null),
          clinicianId: null,
          status: "scheduled",
          source: "native_calendar",
          preparationStatus: "not_started",
          externalEventId: null,
          externalVersion: null,
          questions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setStatus(
        "L’import n’a pas abouti. Rien n’a été modifié dans ton calendrier.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer l’import calendrier"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
        <BrandIllustration variant="connections" style={styles.illustration} />
        <Text style={styles.title}>Choisir un rendez-vous</Text>
        <Text style={styles.subtitle}>
          Cette liste est lue uniquement maintenant, après ton action. Mood Day
          n’analyse pas silencieusement tes calendriers.
        </Text>
      </View>

      <SectionCard
        eyebrow="120 prochains jours"
        title="Import volontaire"
        description="Choisis un événement précis. Son titre, son horaire et son lieu seront copiés dans Mood Day."
      >
        {isLoading ? <ActivityIndicator color={color.primary} /> : null}
        {!isLoading && events.length === 0 ? (
          <Text style={styles.empty}>
            Aucun événement horaire accessible sur cette période.
          </Text>
        ) : null}
        {events.map((event) => {
          const duplicate = isDuplicate(event, appointments);
          return (
            <Pressable
              key={`${event.calendarId}:${event.id}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: duplicate || isPending }}
              disabled={duplicate || isPending}
              onPress={() => void importEvent(event)}
              style={({ pressed }) => [
                styles.event,
                duplicate && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>
                {eventLabel(event)}
                {duplicate ? " · déjà dans Mood Day" : ""}
              </Text>
            </Pressable>
          );
        })}
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
    fontSize: 32,
    lineHeight: 38,
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
  event: {
    minHeight: 68,
    justifyContent: "center",
    gap: space[1],
    padding: space[3],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
  },
  eventTitle: { color: color.ink, fontSize: 15, fontWeight: "700" },
  eventMeta: { color: color.inkMuted, fontSize: 13 },
  empty: { color: color.inkMuted, fontSize: 14, lineHeight: 20 },
  status: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.72 },
});

import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "../src/components/screen";
import { saveAppointmentOfflineFirst } from "../src/lib/local-database";

const pad = (value: number) => value.toString().padStart(2, "0");

export default function NewAppointmentScreen() {
  const router = useRouter();
  const tomorrow = useMemo(() => new Date(Date.now() + 86_400_000), []);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(
    `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`,
  );
  const [time, setTime] = useState("14:00");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    setStatus(undefined);
    try {
      const startsAt = new Date(`${date}T${time}:00`);
      if (Number.isNaN(startsAt.getTime())) throw new Error("invalid_date");
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
      const result = await saveAppointmentOfflineFirst({
        title,
        startsAt: startsAt.toISOString(),
        timezone,
        location: location.trim() || null,
        status: "scheduled",
        source: "moodday",
        preparationStatus: "not_started",
      });
      setStatus(
        result.pending
          ? "Conservé sur cet appareil · synchronisation en attente"
          : "Rendez-vous ajouté",
      );
      setTimeout(() => router.back(), 450);
    } catch {
      setStatus("Vérifie la date et l’heure, puis réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>Fermer</Text>
      </Pressable>
      <View style={styles.heading}>
        <Text style={styles.kicker}>PRÉPARER SANS TOUT RECONSTRUIRE</Text>
        <Text style={styles.title}>Nouveau rendez-vous</Text>
        <Text style={styles.subtitle}>
          Mood Day gardera les questions, décisions et suites autour de ce
          rendez-vous.
        </Text>
      </View>
      <View style={styles.form}>
        <Field label="Nom du rendez-vous">
          <TextInput
            accessibilityLabel="Nom du rendez-vous"
            autoFocus
            maxLength={160}
            onChangeText={setTitle}
            placeholder="Par exemple : suivi avec Dr Martin"
            placeholderTextColor={color.inkMuted}
            style={styles.input}
            value={title}
          />
        </Field>
        <View style={styles.row}>
          <View style={styles.grow}>
            <Field label="Date">
              <TextInput
                accessibilityLabel="Date"
                onChangeText={setDate}
                style={styles.input}
                value={date}
              />
            </Field>
          </View>
          <View style={styles.timeField}>
            <Field label="Heure">
              <TextInput
                accessibilityLabel="Heure"
                onChangeText={setTime}
                style={styles.input}
                value={time}
              />
            </Field>
          </View>
        </View>
        <Field label="Lieu (facultatif)">
          <TextInput
            accessibilityLabel="Lieu"
            maxLength={240}
            onChangeText={setLocation}
            style={styles.input}
            value={location}
          />
        </Field>
        {status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!title.trim() || isSaving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.button,
            (!title.trim() || isSaving) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonLabel}>
            {isSaving ? "Enregistrement…" : "Ajouter le rendez-vous"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { color: color.primary, fontSize: 15, fontWeight: "700" },
  heading: { gap: space[2] },
  kicker: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { color: color.ink, fontSize: 36, lineHeight: 42, fontWeight: "700" },
  subtitle: { color: color.inkMuted, fontSize: 16, lineHeight: 23 },
  form: {
    gap: space[5],
    padding: space[5],
    borderRadius: radius.large,
    backgroundColor: color.surfaceStrong,
  },
  field: { gap: space[2] },
  label: { color: color.ink, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 50,
    paddingHorizontal: space[4],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    color: color.ink,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: space[3] },
  grow: { flex: 1 },
  timeField: { width: 100 },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
  },
  buttonLabel: { color: color.surfaceStrong, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  status: { color: color.primaryDeep, fontSize: 13, lineHeight: 19 },
});

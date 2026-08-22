import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "../src/components/screen";
import { authClient } from "../src/lib/auth-client";
import { saveRoutineOfflineFirst } from "../src/lib/local-database";

export default function NewRoutineScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState("3");
  const [status, setStatus] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!session?.user.id) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const target = Number.parseInt(weeklyTarget, 10);
      const result = await saveRoutineOfflineFirst(session.user.id, {
        title,
        weeklyTarget: Number.isFinite(target) ? target : null,
        status: "active",
      });
      setStatus(
        result.pending
          ? "Conservée sur cet appareil · synchronisation en attente"
          : "Routine ajoutée",
      );
      setTimeout(() => router.back(), 450);
    } catch {
      setStatus("Impossible d’enregistrer cette routine pour le moment.");
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
        <Text style={styles.kicker}>UNE INTENTION, PAS UNE SÉRIE</Text>
        <Text style={styles.title}>Nouvelle routine</Text>
        <Text style={styles.subtitle}>
          Elle pourra être mise en pause et reprise sans rien avoir à rattraper.
        </Text>
      </View>
      <View style={styles.form}>
        <Field label="Ce que tu veux garder en vue">
          <TextInput
            accessibilityLabel="Nom de la routine"
            autoFocus
            maxLength={120}
            onChangeText={setTitle}
            placeholder="Par exemple : marcher un peu"
            placeholderTextColor={color.inkMuted}
            style={styles.input}
            value={title}
          />
        </Field>
        <Field label="Intention par semaine">
          <TextInput
            accessibilityLabel="Nombre de fois par semaine"
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={setWeeklyTarget}
            style={styles.input}
            value={weeklyTarget}
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
            {isSaving ? "Enregistrement…" : "Ajouter cette routine"}
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

import type { MedicationDto, MedicationFrequency } from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../lib/api";
import { authClient } from "../lib/auth-client";
import {
  getCachedMedications,
  saveMedicationOfflineFirst,
  updateMedicationOfflineFirst,
} from "../lib/local-database";
import { BrandIllustration } from "./brand-illustration";
import { Screen } from "./screen";

const frequencies: readonly { id: MedicationFrequency; label: string }[] = [
  { id: "daily", label: "Chaque jour" },
  { id: "twice_daily", label: "Deux fois par jour" },
  { id: "weekly", label: "Chaque semaine" },
  { id: "prn", label: "Au besoin" },
];

const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const nullableNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

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

export function MedicationFormScreen({
  medicationId,
}: {
  medicationId?: string;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [current, setCurrent] = useState<MedicationDto>();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<MedicationFrequency>("daily");
  const [firstTime, setFirstTime] = useState("09:00");
  const [secondTime, setSecondTime] = useState("20:00");
  const [weeklyDay, setWeeklyDay] = useState(new Date().getDay());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stock, setStock] = useState("");
  const [unitsPerDose, setUnitsPerDose] = useState("");
  const [threshold, setThreshold] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(medicationId));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!ownerId || !medicationId) return;
    let active = true;
    let found = false;
    const applyMedication = (medication: MedicationDto) => {
      if (!active) return;
      found = true;
      setCurrent(medication);
      setName(medication.name);
      setDosage(medication.dosage);
      setFrequency(medication.frequency);
      setFirstTime(medication.scheduleTimes[0] ?? "09:00");
      setSecondTime(medication.scheduleTimes[1] ?? "20:00");
      setWeeklyDay(medication.weeklyDay ?? new Date().getDay());
      setStartDate(medication.startDate ?? "");
      setEndDate(medication.endDate ?? "");
      setStock(medication.stockQuantity?.toString() ?? "");
      setUnitsPerDose(medication.unitsPerDose?.toString() ?? "");
      setThreshold(medication.lowStockThreshold?.toString() ?? "");
    };
    void getCachedMedications(ownerId)
      .then(async (cached) => {
        const medication = cached.find((item) => item.id === medicationId);
        if (medication) applyMedication(medication);
        const page = await api.listMedications(undefined, true);
        return page;
      })
      .then((page) => {
        const medication = page.items.find((item) => item.id === medicationId);
        if (medication) applyMedication(medication);
        else if (!found) setStatus("Ce traitement n’est plus disponible.");
      })
      .catch(() =>
        setStatus(
          "Hors ligne · la dernière version connue reste modifiable si elle est disponible.",
        ),
      )
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [medicationId, ownerId]);

  const save = async () => {
    if (!ownerId) return;
    const local = getLocalContext();
    const scheduleTimes =
      frequency === "prn"
        ? []
        : frequency === "twice_daily"
          ? [firstTime, secondTime]
          : [firstTime];
    const write = {
      name,
      dosage,
      frequency,
      scheduleTimes,
      weeklyDay: frequency === "weekly" ? weeklyDay : null,
      startDate: startDate.trim() || null,
      endDate: endDate.trim() || null,
      stockQuantity: nullableNumber(stock),
      unitsPerDose: nullableNumber(unitsPerDose),
      lowStockThreshold: nullableNumber(threshold),
      ...local,
    };
    setIsSaving(true);
    setStatus("Enregistrement sécurisé…");
    try {
      const result = current
        ? await updateMedicationOfflineFirst(ownerId, current, {
            ...write,
            reason: reason.trim(),
          })
        : await saveMedicationOfflineFirst(ownerId, write);
      setStatus(
        result.pending
          ? "Conservé sur cet iPhone · synchronisation en attente."
          : current
            ? "Traitement et historique mis à jour."
            : "Traitement ajouté.",
      );
      setTimeout(() => router.back(), 500);
    } catch {
      setStatus(
        "Vérifie les horaires, les dates et les quantités. Aucune donnée précédente n’a été écrasée.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canSave =
    name.trim().length > 0 &&
    dosage.trim().length > 0 &&
    (!current || reason.trim().length > 0);

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => router.back()}
        style={styles.close}
      >
        <Text style={styles.closeLabel}>Fermer</Text>
      </Pressable>
      <View style={styles.heading}>
        <BrandIllustration variant="treatment" style={styles.illustration} />
        <Text style={styles.title}>
          {current ? "Modifier le traitement" : "Ajouter un traitement"}
        </Text>
        <Text style={styles.subtitle}>
          Mood Day consigne ce que tu déclares sans donner de conseil médical.
        </Text>
      </View>
      {isLoading ? <ActivityIndicator color={color.primary} /> : null}
      <View style={styles.form}>
        <Field label="Nom">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Ex. Lamotrigine"
          />
        </Field>
        <Field label="Dosage déclaré">
          <Input
            value={dosage}
            onChangeText={setDosage}
            placeholder="Ex. 100 mg"
          />
        </Field>
        <Field label="Rythme">
          <View style={styles.choices}>
            {frequencies.map((item) => (
              <Choice
                key={item.id}
                label={item.label}
                selected={frequency === item.id}
                onPress={() => setFrequency(item.id)}
              />
            ))}
          </View>
        </Field>
        {frequency !== "prn" ? (
          <Field label={frequency === "twice_daily" ? "Horaires" : "Horaire"}>
            <Input
              value={firstTime}
              onChangeText={setFirstTime}
              placeholder="09:00"
            />
            {frequency === "twice_daily" ? (
              <Input
                value={secondTime}
                onChangeText={setSecondTime}
                placeholder="20:00"
              />
            ) : null}
          </Field>
        ) : null}
        {frequency === "weekly" ? (
          <Field label="Jour de la semaine">
            <View style={styles.weekdays}>
              {weekdays.map((label, index) => (
                <Choice
                  key={label}
                  compact
                  label={label}
                  selected={weeklyDay === index}
                  onPress={() => setWeeklyDay(index)}
                />
              ))}
            </View>
          </Field>
        ) : null}
        <Field label="Période facultative · AAAA-MM-JJ">
          <Input
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Date de début"
          />
          <Input
            value={endDate}
            onChangeText={setEndDate}
            placeholder="Date de fin"
          />
        </Field>
        <Field label="Stock facultatif">
          <Input
            value={stock}
            onChangeText={setStock}
            placeholder="Quantité actuelle"
            numeric
          />
          <Input
            value={unitsPerDose}
            onChangeText={setUnitsPerDose}
            placeholder="Unités par prise"
            numeric
          />
          <Input
            value={threshold}
            onChangeText={setThreshold}
            placeholder="Seuil bas"
            numeric
          />
        </Field>
        {current ? (
          <Field label="Motif de la modification">
            <Input
              value={reason}
              onChangeText={setReason}
              placeholder="Ce qui a changé"
            />
          </Field>
        ) : null}
        {status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave || isSaving }}
          disabled={!canSave || isSaving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.save,
            (!canSave || isSaving) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveLabel}>
            {isSaving
              ? "Enregistrement…"
              : current
                ? "Enregistrer la modification"
                : "Ajouter ce traitement"}
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

function Input({
  numeric = false,
  ...props
}: React.ComponentProps<typeof TextInput> & { numeric?: boolean }) {
  return (
    <TextInput
      {...props}
      keyboardType={numeric ? "decimal-pad" : "default"}
      maxLength={200}
      placeholderTextColor={color.inkMuted}
      style={styles.input}
    />
  );
}

function Choice({
  compact = false,
  label,
  onPress,
  selected,
}: {
  compact?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        compact && styles.choiceCompact,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start" },
  closeLabel: { color: color.primaryDeep, fontSize: 15, fontWeight: "700" },
  heading: { alignItems: "center", gap: space[2] },
  illustration: { width: 180, height: 116 },
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
  form: {
    gap: space[5],
    padding: space[5],
    borderRadius: radius.large,
    backgroundColor: color.surfaceStrong,
  },
  field: { gap: space[2] },
  label: { color: color.ink, fontSize: 14, fontWeight: "800" },
  input: {
    minHeight: 50,
    paddingHorizontal: space[3],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    color: color.ink,
    fontSize: 16,
    backgroundColor: color.surface,
  },
  choices: { gap: space[2] },
  weekdays: { flexDirection: "row", flexWrap: "wrap", gap: space[1] },
  choice: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space[3],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
  },
  choiceCompact: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: space[2],
  },
  choiceSelected: {
    borderColor: color.primary,
    backgroundColor: color.primarySoft,
  },
  choiceLabel: { color: color.ink, fontSize: 14, fontWeight: "700" },
  save: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
    paddingHorizontal: space[3],
  },
  saveLabel: {
    color: color.surfaceStrong,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  status: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

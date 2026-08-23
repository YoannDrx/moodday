import type { SafetyPlanDto, SafetyPlanWriteInput } from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandIllustration } from "../src/components/brand-illustration";
import { Screen } from "../src/components/screen";
import { SectionCard } from "../src/components/section-card";
import { api } from "../src/lib/api";
import { authClient } from "../src/lib/auth-client";
import {
  cacheSafetyPlan,
  getCachedSafetyPlan,
} from "../src/lib/local-database";

type Draft = {
  warningSigns: string;
  copingStrategies: string;
  safePlaces: string;
  trustedContacts: string;
  professionalContacts: string;
};

const emptyDraft: Draft = {
  warningSigns: "",
  copingStrategies: "",
  safePlaces: "",
  trustedContacts: "",
  professionalContacts: "",
};

const listToText = (items: readonly string[]) => items.join("\n");
const contactsToText = (
  contacts: readonly { name: string; detail: string }[],
) =>
  contacts.map((contact) => `${contact.name} — ${contact.detail}`).join("\n");

const planToDraft = (plan: SafetyPlanDto): Draft => ({
  warningSigns: listToText(plan.warningSigns),
  copingStrategies: listToText(plan.copingStrategies),
  safePlaces: listToText(plan.safePlaces),
  trustedContacts: contactsToText(plan.trustedContacts),
  professionalContacts: contactsToText(plan.professionalContacts),
});

const textToList = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);

const textToContacts = (value: string) =>
  value
    .split("\n")
    .map((line) => line.split(/\s+[—-]\s+/, 2).map((item) => item.trim()))
    .filter((parts) => parts.length === 2 && parts.every(Boolean))
    .slice(0, 10)
    .map(([name = "", detail = ""]) => ({ name, detail }));

const draftToInput = (draft: Draft): SafetyPlanWriteInput => ({
  warningSigns: textToList(draft.warningSigns),
  copingStrategies: textToList(draft.copingStrategies),
  safePlaces: textToList(draft.safePlaces),
  trustedContacts: textToContacts(draft.trustedContacts),
  professionalContacts: textToContacts(draft.professionalContacts),
  markReviewed: true,
});

const fields = [
  ["warningSigns", "Mes signaux personnels"],
  ["copingStrategies", "Ce qui peut m’apaiser"],
  ["safePlaces", "Lieux où je me sens en sécurité"],
  ["trustedContacts", "Contacts de confiance · Nom — coordonnées"],
  ["professionalContacts", "Contacts professionnels · Nom — coordonnées"],
] as const;

const call = async (number: "3114" | "15" | "112") =>
  Linking.openURL(`tel:${number}`);

export default function SafetyPlanScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [draft, setDraft] = useState(emptyDraft);
  const [isPending, setIsPending] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [status, setStatus] = useState<string>();

  const load = useCallback(async () => {
    if (!ownerId) return;
    const cached = await getCachedSafetyPlan(ownerId);
    if (cached) {
      setDraft(planToDraft(cached));
      setHasPlan(true);
      setStatus("Plan disponible hors ligne sur cet iPhone.");
    }
    try {
      const remote = await api.getSafetyPlan();
      if (!remote) return;
      await cacheSafetyPlan(ownerId, remote);
      setDraft(planToDraft(remote));
      setHasPlan(true);
      setStatus("Plan à jour et disponible hors ligne.");
    } catch {
      setStatus(
        cached
          ? "Hors ligne · la dernière version chiffrée reste accessible."
          : "Connexion indisponible. Les numéros d’urgence restent accessibles.",
      );
    }
  }, [ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!ownerId) return;
    setIsPending(true);
    setStatus("Enregistrement…");
    try {
      const plan = await api.saveSafetyPlan(draftToInput(draft));
      await cacheSafetyPlan(ownerId, plan);
      setHasPlan(true);
      setStatus("Plan enregistré et conservé hors ligne sur cet iPhone.");
    } catch {
      setStatus(
        "L’enregistrement nécessite une connexion. La version déjà disponible hors ligne n’a pas été remplacée.",
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
          accessibilityLabel="Fermer le plan de sécurité"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
        <BrandIllustration variant="safety" style={styles.illustration} />
        <Text style={styles.title}>Mon plan de sécurité</Text>
        <Text style={styles.subtitle}>
          Un repère personnel, facultatif et privé. Mood Day ne contacte jamais
          quelqu’un automatiquement.
        </Text>
      </View>

      <SectionCard
        eyebrow="Besoin d’aide maintenant"
        title="Mood Day n’est pas un service d’urgence"
        description="En France, tu peux appeler gratuitement le 3114. En cas d’urgence médicale, appelle le 15 ou le 112."
      >
        <View style={styles.emergencyRow}>
          {(["3114", "15", "112"] as const).map((number) => (
            <Pressable
              key={number}
              accessibilityRole="button"
              accessibilityLabel={`Appeler le ${number}`}
              onPress={() => void call(number)}
              style={({ pressed }) => [
                styles.emergencyButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emergencyLabel}>Appeler {number}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        eyebrow={hasPlan ? "Plan personnel" : "Créer mon repère"}
        title="Un élément par ligne"
        description="Pour les contacts, utilise le format Nom — coordonnées. Les notes de ce plan ne sont jamais incluses dans Cercle ou dans un brief de rendez-vous."
      >
        {fields.map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              accessibilityLabel={label}
              editable={!isPending}
              multiline
              maxLength={10_000}
              onChangeText={(value) =>
                setDraft((current) => ({ ...current, [key]: value }))
              }
              placeholder="Un élément par ligne"
              placeholderTextColor={color.inkMuted}
              style={styles.input}
              textAlignVertical="top"
              value={draft[key]}
            />
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          disabled={isPending}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.primaryButton,
            isPending && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryLabel}>
            {isPending
              ? "Enregistrement…"
              : "Enregistrer et marquer comme revu"}
          </Text>
        </Pressable>
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
  emergencyRow: { gap: space[2] },
  emergencyButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.dangerSoft,
    borderWidth: 1,
    borderColor: color.danger,
  },
  emergencyLabel: { color: color.danger, fontSize: 15, fontWeight: "700" },
  field: { gap: space[2] },
  label: { color: color.ink, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    backgroundColor: color.surface,
    color: color.ink,
    fontSize: 15,
    lineHeight: 22,
    padding: space[3],
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
    backgroundColor: color.primary,
    paddingHorizontal: space[4],
  },
  primaryLabel: {
    color: color.surfaceStrong,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  status: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});

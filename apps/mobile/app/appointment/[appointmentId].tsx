import type {
  AppointmentBriefDto,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
} from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { api } from "../../src/lib/api";
import {
  getCachedAppointmentDecisions,
  getCachedAppointmentEvents,
  getCachedAppointmentQuestions,
  getCachedAppointments,
  saveAppointmentDecisionOfflineFirst,
  saveAppointmentEventOfflineFirst,
  saveAppointmentQuestionOfflineFirst,
  synchronizeNow,
} from "../../src/lib/local-database";

const appointmentLabel = (startsAt: string, timezone: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(startsAt));

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId: string }>();
  const appointmentId = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;
  const [appointment, setAppointment] =
    useState<Awaited<ReturnType<typeof getCachedAppointments>>[number]>();
  const [questions, setQuestions] = useState<AppointmentQuestionDto[]>([]);
  const [events, setEvents] = useState<AppointmentEventDto[]>([]);
  const [decisions, setDecisions] = useState<AppointmentDecisionDto[]>([]);
  const [briefs, setBriefs] = useState<AppointmentBriefDto[]>([]);
  const [question, setQuestion] = useState("");
  const [privateNote, setPrivateNote] = useState(false);
  const [decision, setDecision] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [status, setStatus] = useState<string>();

  const readCache = useCallback(async () => {
    if (!appointmentId) return;
    const [appointments, cachedQuestions, cachedEvents, cachedDecisions] =
      await Promise.all([
        getCachedAppointments(),
        getCachedAppointmentQuestions(appointmentId),
        getCachedAppointmentEvents(appointmentId),
        getCachedAppointmentDecisions(appointmentId),
      ]);
    setAppointment(appointments.find((item) => item.id === appointmentId));
    setQuestions(cachedQuestions);
    setEvents(cachedEvents);
    setDecisions(cachedDecisions);
  }, [appointmentId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    await readCache();
    if (!appointmentId) {
      setIsLoading(false);
      return;
    }
    try {
      await synchronizeNow();
      await readCache();
      const artifacts = await api.listAppointmentArtifacts(appointmentId);
      setQuestions(artifacts.questions);
      setEvents(artifacts.events);
      setDecisions(artifacts.decisions);
      setBriefs(artifacts.briefs);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, readCache]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const addQuestion = async () => {
    if (!appointmentId || !question.trim()) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const content = question.trim();
      const result = await saveAppointmentQuestionOfflineFirst(appointmentId, {
        content,
        privateNote,
      });
      setQuestions((current) => [
        ...current,
        {
          id: result.entityId,
          appointmentId,
          operationId: result.operationId,
          position: current.length,
          content,
          privateNote,
          answeredAt: null,
        },
      ]);
      setQuestion("");
      setPrivateNote(false);
      setStatus(
        result.pending
          ? "Conservé sur cet appareil · synchronisation en attente"
          : "Question ajoutée",
      );
    } catch {
      setStatus("Impossible d’ajouter cette question pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const addSessionEvent = async (type: "session_started" | "session_ended") => {
    if (!appointmentId) return;
    setIsSaving(true);
    setStatus(undefined);
    const now = new Date().toISOString();
    try {
      const result = await saveAppointmentEventOfflineFirst(appointmentId, {
        type,
        occurredAt: now,
      });
      setEvents((current) => [
        ...current,
        {
          id: result.entityId,
          appointmentId,
          operationId: result.operationId,
          type,
          occurredAt: now,
          payload: null,
          createdAt: now,
        },
      ]);
      setStatus(
        result.pending
          ? "Repère conservé hors ligne"
          : type === "session_started"
            ? "Mode séance démarré"
            : "Fin de séance notée",
      );
    } catch {
      setStatus("Impossible d’enregistrer ce repère pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const addDecision = async () => {
    if (!appointmentId || !decision.trim()) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const summary = decision.trim();
      const result = await saveAppointmentDecisionOfflineFirst(appointmentId, {
        summary,
        status: "open",
        includeInBrief: true,
      });
      const now = new Date().toISOString();
      setDecisions((current) => [
        ...current,
        {
          id: result.entityId,
          appointmentId,
          operationId: result.operationId,
          summary,
          status: "open",
          includeInBrief: true,
          dueAt: null,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      setDecision("");
      setStatus(
        result.pending
          ? "Suite conservée hors ligne"
          : "Suite ajoutée au débrief",
      );
    } catch {
      setStatus("Impossible d’ajouter cette suite pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const createBrief = async () => {
    if (!appointmentId || isOffline) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const artifact = await api.createAppointmentArtifact(appointmentId, {
        kind: "brief",
        operationId: `operation-${Crypto.randomUUID()}`,
        briefId: `brief-${Crypto.randomUUID()}`,
      });
      const brief = artifact as AppointmentBriefDto;
      setBriefs((current) => [brief, ...current]);
      setStatus("Brief créé sans les notes privées");
    } catch {
      setStatus("Le brief nécessite une connexion. Réessaie plus tard.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!appointment && !isLoading) {
    return (
      <Screen>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>Retour</Text>
        </Pressable>
        <SectionCard
          title="Rendez-vous indisponible"
          description="Synchronise l’app ou reviens à la liste des soins."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>Retour au soin</Text>
      </Pressable>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>TON RENDEZ-VOUS</Text>
          <Text style={styles.title}>
            {appointment?.title ?? "Rendez-vous"}
          </Text>
          {appointment ? (
            <Text style={styles.subtitle}>
              {appointmentLabel(appointment.startsAt, appointment.timezone)}
              {appointment.location ? ` · ${appointment.location}` : ""}
            </Text>
          ) : null}
        </View>
        <BrandIllustration variant="brief" style={styles.visual} />
      </View>

      {isOffline ? (
        <View accessibilityRole="alert" style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Hors ligne · questions, séance et débrief restent enregistrables. Le
            brief sera disponible après synchronisation.
          </Text>
        </View>
      ) : null}

      <SectionCard
        eyebrow="Avant"
        title="Questions à garder sous la main"
        description="Marque une note privée pour l’exclure de tous les briefs."
      >
        <TextInput
          accessibilityLabel="Question pour le rendez-vous"
          maxLength={1000}
          multiline
          onChangeText={setQuestion}
          placeholder="Ce que tu veux aborder…"
          placeholderTextColor={color.inkMuted}
          style={[styles.input, styles.multiline]}
          value={question}
        />
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Garder hors du brief</Text>
            <Text style={styles.switchDescription}>Visible uniquement ici</Text>
          </View>
          <Switch
            accessibilityLabel="Garder cette question hors du brief"
            onValueChange={setPrivateNote}
            trackColor={{ false: color.border, true: color.sage }}
            value={privateNote}
          />
        </View>
        <ActionButton
          disabled={!question.trim() || isSaving}
          label="Ajouter la question"
          onPress={() => void addQuestion()}
        />
        {questions.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <Text style={styles.listText}>{item.content}</Text>
            {item.privateNote ? (
              <Text style={styles.privateLabel}>PRIVÉE · HORS DU BRIEF</Text>
            ) : null}
          </View>
        ))}
      </SectionCard>

      <SectionCard
        eyebrow="Pendant"
        title="Mode séance"
        description="Seulement des repères temporels, sans analyse automatique."
      >
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <ActionButton
              disabled={isSaving}
              label="Commencer"
              onPress={() => void addSessionEvent("session_started")}
            />
          </View>
          <View style={styles.flexButton}>
            <ActionButton
              disabled={isSaving}
              label="Noter la fin"
              onPress={() => void addSessionEvent("session_ended")}
              secondary
            />
          </View>
        </View>
        <Text style={styles.meta}>
          {events.length} repère{events.length > 1 ? "s" : ""} enregistré
          {events.length > 1 ? "s" : ""}
        </Text>
      </SectionCard>

      <SectionCard
        eyebrow="Après"
        title="Décisions et suites"
        description="Les prochaines étapes telles qu’elles ont été décidées."
      >
        <TextInput
          accessibilityLabel="Suite décidée pendant le rendez-vous"
          maxLength={500}
          multiline
          onChangeText={setDecision}
          placeholder="Une suite à retenir…"
          placeholderTextColor={color.inkMuted}
          style={[styles.input, styles.multiline]}
          value={decision}
        />
        <ActionButton
          disabled={!decision.trim() || isSaving}
          label="Ajouter au débrief"
          onPress={() => void addDecision()}
        />
        {decisions.map((item) => (
          <View key={item.id} style={styles.decisionItem}>
            <Text style={styles.listText}>{item.summary}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard
        eyebrow="Partager"
        title="Brief de consultation"
        description="Versionné et généré côté serveur depuis une liste de champs autorisés."
      >
        <ActionButton
          disabled={isSaving || isOffline}
          label={isOffline ? "Connexion nécessaire" : "Créer un brief"}
          onPress={() => void createBrief()}
        />
        {briefs[0] ? (
          <Text style={styles.meta}>
            Version {briefs[0].version} · {briefs[0].content.questions.length}{" "}
            question(s) · {briefs[0].content.excludedPrivateQuestionCount}{" "}
            note(s) privée(s) exclue(s)
          </Text>
        ) : null}
      </SectionCard>

      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
      ) : null}
      {isLoading ? (
        <View accessibilityLabel="Chargement en cours" style={styles.loading}>
          <ActivityIndicator color={color.primary} />
          <Text style={styles.meta}>Mise à jour du rendez-vous…</Text>
        </View>
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
  disabled?: boolean;
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
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
  back: { color: color.primary, fontSize: 15, fontWeight: "700" },
  hero: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.large,
    backgroundColor: color.primarySoft,
    overflow: "hidden",
    paddingLeft: space[5],
  },
  heroCopy: { flex: 1, gap: space[2], paddingVertical: space[5] },
  visual: { width: 112, height: 130, alignSelf: "flex-end" },
  kicker: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { color: color.ink, fontSize: 29, lineHeight: 35, fontWeight: "700" },
  subtitle: { color: color.inkMuted, fontSize: 14, lineHeight: 20 },
  offlineBanner: {
    padding: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.apricot,
  },
  offlineText: { color: color.ink, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 50,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.medium,
    color: color.ink,
    fontSize: 16,
    backgroundColor: color.surfaceStrong,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  switchRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingHorizontal: space[3],
    borderRadius: radius.medium,
    backgroundColor: color.canvas,
  },
  switchCopy: { flex: 1 },
  switchTitle: { color: color.ink, fontSize: 14, fontWeight: "700" },
  switchDescription: { color: color.inkMuted, fontSize: 12, marginTop: 2 },
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
  actionLabel: { color: color.surfaceStrong, fontSize: 14, fontWeight: "800" },
  actionLabelSecondary: { color: color.primaryDeep },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  listItem: {
    gap: space[2],
    padding: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.canvas,
  },
  decisionItem: {
    padding: space[4],
    borderRadius: radius.medium,
    backgroundColor: "#F8F1EA",
  },
  listText: { color: color.ink, fontSize: 14, lineHeight: 20 },
  privateLabel: {
    color: "#744C30",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  buttonRow: { flexDirection: "row", gap: space[3] },
  flexButton: { flex: 1 },
  meta: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  status: {
    color: color.primaryDeep,
    fontSize: 13,
    lineHeight: 19,
    padding: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.primarySoft,
  },
  loading: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: space[2],
  },
});

import type {
  AppointmentBriefDto,
  AppointmentBriefShareDto,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
} from "@moodday/contracts";
import { MoodDayApiError } from "@moodday/api-client";
import { color, radius, space } from "@moodday/design-tokens";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { api, appBaseUrl } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";
import {
  getCachedAppointmentDecisions,
  getCachedAppointmentEvents,
  getCachedAppointmentQuestions,
  getCachedAppointments,
  getCachedUserDraft,
  discardUserDraft,
  refreshUserDraft,
  saveAppointmentDecisionOfflineFirst,
  saveAppointmentEventOfflineFirst,
  saveAppointmentQuestionOfflineFirst,
  saveUserDraftLocally,
  synchronizeNow,
} from "../../src/lib/local-database";
import { presentNativeCalendarEvent } from "../../src/lib/native-calendar";

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
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
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
  const [shares, setShares] = useState<AppointmentBriefShareDto[]>([]);
  const [latestShareUrl, setLatestShareUrl] = useState<string>();
  const [question, setQuestion] = useState("");
  const [privateNote, setPrivateNote] = useState(false);
  const [decision, setDecision] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [status, setStatus] = useState<string>();

  const readCache = useCallback(async () => {
    if (!appointmentId || !ownerId) return;
    const [appointments, cachedQuestions, cachedEvents, cachedDecisions] =
      await Promise.all([
        getCachedAppointments(ownerId),
        getCachedAppointmentQuestions(ownerId, appointmentId),
        getCachedAppointmentEvents(ownerId, appointmentId),
        getCachedAppointmentDecisions(ownerId, appointmentId),
      ]);
    setAppointment(appointments.find((item) => item.id === appointmentId));
    setQuestions(cachedQuestions);
    setEvents(cachedEvents);
    setDecisions(cachedDecisions);
  }, [appointmentId, ownerId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    await readCache();
    if (!appointmentId || !ownerId) {
      setIsLoading(false);
      return;
    }
    try {
      await synchronizeNow(ownerId);
      await readCache();
      const artifacts = await api.listAppointmentArtifacts(appointmentId);
      setQuestions(artifacts.questions);
      setEvents(artifacts.events);
      setDecisions(artifacts.decisions);
      setBriefs(artifacts.briefs);
      setShares(
        artifacts.briefs[0]
          ? await api.listAppointmentBriefShares(artifacts.briefs[0].id)
          : [],
      );
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, ownerId, readCache]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!appointmentId || !ownerId) return;
    const restore = async () => {
      const cached = await getCachedUserDraft(
        ownerId,
        "appointment_preparation",
        appointmentId,
      );
      const draft =
        cached ??
        (await refreshUserDraft(
          ownerId,
          "appointment_preparation",
          appointmentId,
        ).catch(() => null));
      if (!draft) return;
      if (typeof draft.content.question === "string") {
        setQuestion(draft.content.question);
      }
      if (typeof draft.content.privateNote === "boolean") {
        setPrivateNote(draft.content.privateNote);
      }
      setStatus("Ta préparation en cours est disponible.");
    };
    void restore();
  }, [appointmentId, ownerId]);

  useEffect(() => {
    if (!appointmentId || !ownerId || !question.trim()) return;
    const timeout = setTimeout(() => {
      void saveUserDraftLocally(ownerId, {
        kind: "appointment_preparation",
        contextKey: appointmentId,
        content: { question, privateNote },
      }).then((result) => {
        if (result.pending)
          setStatus("Préparation conservée sur cet appareil.");
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [appointmentId, ownerId, privateNote, question]);

  const addQuestion = async () => {
    if (!appointmentId || !ownerId || !question.trim()) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const content = question.trim();
      const result = await saveAppointmentQuestionOfflineFirst(
        ownerId,
        appointmentId,
        {
          content,
          privateNote,
        },
      );
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
      await discardUserDraft(
        ownerId,
        "appointment_preparation",
        appointmentId,
      ).catch(() => undefined);
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
    if (!appointmentId || !ownerId) return;
    setIsSaving(true);
    setStatus(undefined);
    const now = new Date().toISOString();
    try {
      const result = await saveAppointmentEventOfflineFirst(
        ownerId,
        appointmentId,
        {
          type,
          occurredAt: now,
        },
      );
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
    if (!appointmentId || !ownerId || !decision.trim()) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const summary = decision.trim();
      const result = await saveAppointmentDecisionOfflineFirst(
        ownerId,
        appointmentId,
        {
          summary,
          status: "open",
          includeInBrief: true,
        },
      );
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
      setShares([]);
      setLatestShareUrl(undefined);
      setStatus("Brief créé sans les notes privées");
    } catch {
      setStatus("Le brief nécessite une connexion. Réessaie plus tard.");
    } finally {
      setIsSaving(false);
    }
  };

  const createShare = async () => {
    const brief = briefs[0];
    if (!brief || isOffline) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const token = (
        await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Crypto.randomUUID()}:${Crypto.randomUUID()}`,
          { encoding: Crypto.CryptoEncoding.BASE64 },
        )
      )
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
      const result = await api.createAppointmentBriefShare(brief.id, {
        operationId: `operation-${Crypto.randomUUID()}`,
        shareId: `share-${Crypto.randomUUID()}`,
        token,
        expiresInHours: 24,
      });
      setShares((current) => [result.share, ...current]);
      const shareUrl = `${appBaseUrl}/brief#${result.token}`;
      setLatestShareUrl(shareUrl);
      try {
        await Share.share({
          title: "Brief Mood Day",
          message: shareUrl,
          url: shareUrl,
        });
        setStatus("Lien créé pour 24 heures. Tu peux le révoquer ici.");
      } catch {
        setStatus("Lien créé. Tu peux le sélectionner ci-dessous.");
      }
    } catch (error) {
      setStatus(
        error instanceof MoodDayApiError &&
          error.code === "recent_authentication_required"
          ? "Reconnecte-toi avant de partager ce brief."
          : "Impossible de créer le lien pour le moment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    const brief = briefs[0];
    if (!brief || isOffline) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      await api.revokeAppointmentBriefShare(brief.id, shareId);
      setShares((current) =>
        current.map((share) =>
          share.id === shareId
            ? { ...share, revokedAt: new Date().toISOString() }
            : share,
        ),
      );
      setStatus("Lien révoqué immédiatement.");
    } catch (error) {
      setStatus(
        error instanceof MoodDayApiError &&
          error.code === "recent_authentication_required"
          ? "Reconnecte-toi avant de révoquer ce lien."
          : "Impossible de révoquer le lien pour le moment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addToNativeCalendar = async () => {
    if (!appointment) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const result = await presentNativeCalendarEvent(appointment);
      setStatus(
        result.saved
          ? "Rendez-vous ajouté au calendrier choisi."
          : "Ajout au calendrier annulé. Rien n’a été modifié.",
      );
    } catch {
      setStatus("Le calendrier natif est indisponible pour le moment.");
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
        eyebrow="Calendrier iPhone"
        title="Ajouter volontairement"
        description="La fiche système te laisse choisir le calendrier et confirmer. Seuls le titre, l’horaire et le lieu sont proposés ; aucune question ni note privée."
      >
        <ActionButton
          disabled={isSaving}
          label="Ouvrir la fiche calendrier"
          onPress={() => void addToNativeCalendar()}
          secondary
        />
      </SectionCard>

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
            {latestShareUrl ? (
              <View style={styles.latestShare}>
                <Text style={styles.latestShareLabel}>
                  Dernier lien créé · sélectionnable
                </Text>
                <Text selectable style={styles.latestShareValue}>
                  {latestShareUrl}
                </Text>
              </View>
            ) : null}
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
          <View style={styles.briefActions}>
            <Text style={styles.meta}>
              Version {briefs[0].version} · {briefs[0].content.questions.length}{" "}
              question(s) · {briefs[0].content.excludedPrivateQuestionCount}{" "}
              note(s) privée(s) exclue(s)
            </Text>
            <ActionButton
              disabled={isSaving || isOffline}
              label="Partager pendant 24 heures"
              onPress={() => void createShare()}
              secondary
            />
            {shares.map((share) => {
              const active =
                !share.revokedAt && new Date(share.expiresAt) > new Date();
              return (
                <View key={share.id} style={styles.shareRow}>
                  <Text style={styles.shareMeta}>
                    {active ? "Lien actif" : "Lien inactif"} ·{" "}
                    {share.accessCount} accès
                  </Text>
                  {active ? (
                    <Pressable
                      accessibilityLabel="Révoquer ce lien temporaire"
                      accessibilityRole="button"
                      disabled={isSaving || isOffline}
                      onPress={() => void revokeShare(share.id)}
                      style={({ pressed }) => [
                        styles.revokeButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.revokeLabel}>Révoquer</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
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
  briefActions: { gap: space[3] },
  shareRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[3],
    paddingLeft: space[3],
    borderRadius: radius.medium,
    backgroundColor: color.canvas,
  },
  shareMeta: { flex: 1, color: color.inkMuted, fontSize: 12 },
  latestShare: {
    gap: space[2],
    padding: space[3],
    borderRadius: radius.medium,
    backgroundColor: color.canvas,
  },
  latestShareLabel: { color: color.inkMuted, fontSize: 12, fontWeight: "700" },
  latestShareValue: { color: color.primary, fontSize: 12, lineHeight: 18 },
  revokeButton: {
    minWidth: 88,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.medium,
  },
  revokeLabel: { color: "#8b3f32", fontSize: 13, fontWeight: "700" },
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

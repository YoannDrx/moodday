import type {
  CircleRelationshipDto,
  SharePermission,
  SupportRequestDto,
  SupportRequestKind,
} from "@moodday/contracts";
import { color, radius, space } from "@moodday/design-tokens";
import * as Crypto from "expo-crypto";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandIllustration } from "../../src/components/brand-illustration";
import { Screen } from "../../src/components/screen";
import { SectionCard } from "../../src/components/section-card";
import { api, appBaseUrl } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";

const permissionOptions: {
  value: SharePermission;
  label: string;
}[] = [
  { value: "support_requests", label: "Demandes de soutien" },
  { value: "appointments", label: "Rendez-vous choisis" },
  { value: "mood_summary", label: "Résumé de repères" },
  { value: "medication_adherence", label: "Synthèse des prises" },
  { value: "caregiver_observations", label: "Contributions attribuées" },
];

const supportKinds: { value: SupportRequestKind; label: string }[] = [
  { value: "call", label: "Un appel" },
  { value: "presence", label: "Une présence" },
  { value: "walk", label: "Une promenade" },
  { value: "meal", label: "Un repas" },
  { value: "transport", label: "Un accompagnement" },
  { value: "other", label: "Autre chose" },
];

export default function CircleScreen() {
  const { data: session } = authClient.useSession();
  const [relationships, setRelationships] = useState<CircleRelationshipDto[]>(
    [],
  );
  const [requests, setRequests] = useState<SupportRequestDto[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [permissions, setPermissions] = useState<SharePermission[]>([
    "support_requests",
  ]);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [supportKind, setSupportKind] = useState<SupportRequestKind>("call");
  const [supportMessage, setSupportMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [circle, supportRequests] = await Promise.all([
        api.listCircleRelationships(),
        api.listSupportRequests(),
      ]);
      setRelationships(circle);
      setRequests(supportRequests);
      setStatus(undefined);
    } catch {
      setStatus(
        "Cercle n’est pas disponible ou la connexion est interrompue. Aucune donnée n’a été modifiée.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const togglePermission = (permission: SharePermission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const invite = async () => {
    if (!email.trim() || permissions.length === 0) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const result = await api.createCircleInvitation({
        operationId: `operation-${Crypto.randomUUID()}`,
        relationshipId: `relationship-${Crypto.randomUUID()}`,
        invitationEmail: email.trim(),
        displayName: displayName.trim() || null,
        permissions,
        durationDays: 30,
      });
      setRelationships((current) => [result.relationship, ...current]);
      setEmail("");
      setDisplayName("");
      const invitationUrl = `${appBaseUrl}/circle/accept?token=${encodeURIComponent(result.invitationToken)}`;
      await Share.share({
        title: "Invitation Mood Day",
        message: `Je t’invite dans mon Cercle Mood Day. Tu verras le contrat exact avant d’accepter : ${invitationUrl}`,
        url: invitationUrl,
      });
      setStatus("Invitation créée. Le partage est resté sous ton contrôle.");
    } catch {
      setStatus("Impossible de créer cette invitation pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const revoke = async (relationshipId: string) => {
    setIsSaving(true);
    setStatus(undefined);
    try {
      await api.revokeCircleRelationship(relationshipId);
      setRelationships((current) =>
        current.map((item) =>
          item.id === relationshipId
            ? {
                ...item,
                status: "revoked",
                revokedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setStatus("Accès révoqué dès la prochaine requête.");
    } catch {
      setStatus("La révocation n’a pas abouti. Réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  const askForSupport = async () => {
    if (!selectedRelationship) return;
    setIsSaving(true);
    setStatus(undefined);
    try {
      const result = await api.createSupportRequest({
        operationId: `operation-${Crypto.randomUUID()}`,
        relationshipId: selectedRelationship,
        kind: supportKind,
        message: supportMessage.trim() || null,
        requestedFor: null,
      });
      setRequests((current) => [result, ...current]);
      setSupportMessage("");
      setStatus("Demande créée, sans donnée supplémentaire sur ton état.");
    } catch {
      setStatus("Cette demande ne peut pas être envoyée pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const respond = async (
    supportRequestId: string,
    responseStatus: "accepted" | "declined",
  ) => {
    setIsSaving(true);
    setStatus(undefined);
    try {
      const result = await api.respondToSupportRequest(supportRequestId, {
        status: responseStatus,
      });
      setRequests((current) =>
        current.map((item) => (item.id === result.id ? result : item)),
      );
      setStatus(
        responseStatus === "accepted" ? "Demande acceptée" : "Demande déclinée",
      );
    } catch {
      setStatus("Cette réponse ne peut pas être enregistrée pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeRelationships = relationships.filter(
    (item) =>
      item.status === "active" && item.permissions.includes("support_requests"),
  );

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>TON SOUTIEN, À TES CONDITIONS</Text>
          <Text style={styles.title}>Cercle</Text>
        </View>
        <BrandIllustration variant="circle" style={styles.visual} />
      </View>

      <SectionCard
        title="Tu gardes le contrôle"
        description="Aucun proche ne reçoit d’alerte automatique. Tu choisis la personne, la demande, ce qu’elle voit et pour combien de temps."
      />

      <SectionCard
        eyebrow="Inviter"
        title="Un contrat lisible"
        description="Le lien affiche la portée exacte avant toute acceptation."
      >
        <TextInput
          accessibilityLabel="Adresse e-mail de la personne"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="proche@exemple.fr"
          placeholderTextColor={color.inkMuted}
          style={styles.input}
          value={email}
        />
        <TextInput
          accessibilityLabel="Prénom facultatif"
          maxLength={100}
          onChangeText={setDisplayName}
          placeholder="Prénom ou repère (facultatif)"
          placeholderTextColor={color.inkMuted}
          style={styles.input}
          value={displayName}
        />
        <View style={styles.permissionList}>
          {permissionOptions.map((option) => {
            const selected = permissions.includes(option.value);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                key={option.value}
                onPress={() => togglePermission(option.value)}
                style={({ pressed }) => [
                  styles.permission,
                  selected && styles.permissionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[styles.checkbox, selected && styles.checkboxSelected]}
                />
                <Text style={styles.permissionLabel}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.neverShared}>
          Jamais partagé : notes libres, plan de sécurité, diagnostic supposé ou
          alerte automatique.
        </Text>
        <ActionButton
          disabled={!email.trim() || permissions.length === 0 || isSaving}
          label="Créer et partager l’invitation"
          onPress={() => void invite()}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Accès"
        title="Qui voit quoi"
        description="La révocation est immédiate côté serveur."
      >
        {relationships.length > 0 ? (
          relationships.map((item) => (
            <View key={item.id} style={styles.relationship}>
              <Text style={styles.relationshipName}>
                {item.displayName ?? item.invitationEmail}
              </Text>
              <Text style={styles.meta}>
                {item.status} · jusqu’au{" "}
                {new Intl.DateTimeFormat("fr-FR").format(
                  new Date(item.expiresAt),
                )}
              </Text>
              <Text style={styles.permissionsSummary}>
                {item.permissions
                  .map(
                    (permission) =>
                      permissionOptions.find(
                        (option) => option.value === permission,
                      )?.label ?? permission,
                  )
                  .join(" · ")}
              </Text>
              {item.status !== "revoked" ? (
                <ActionButton
                  danger
                  disabled={isSaving}
                  label="Révoquer l’accès"
                  onPress={() => void revoke(item.id)}
                />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.meta}>
            Personne dans ton Cercle pour l’instant.
          </Text>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Demander"
        title="Un soutien précis"
        description="Un appel, une présence, une promenade, un repas ou un accompagnement."
      >
        {activeRelationships.length > 0 ? (
          <>
            <Text style={styles.fieldLabel}>À qui</Text>
            <View style={styles.chips}>
              {activeRelationships.map((item) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: selectedRelationship === item.id,
                  }}
                  key={item.id}
                  onPress={() => setSelectedRelationship(item.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selectedRelationship === item.id && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.chipLabel}>
                    {item.displayName ?? item.invitationEmail}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Ce qui t’aiderait</Text>
            <View style={styles.chips}>
              {supportKinds.map((item) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: supportKind === item.value }}
                  key={item.value}
                  onPress={() => setSupportKind(item.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    supportKind === item.value && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.chipLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              accessibilityLabel="Message facultatif"
              maxLength={500}
              multiline
              onChangeText={setSupportMessage}
              placeholder="Un détail utile, si tu le souhaites"
              placeholderTextColor={color.inkMuted}
              style={[styles.input, styles.multiline]}
              value={supportMessage}
            />
            <ActionButton
              disabled={!selectedRelationship || isSaving}
              label="Créer la demande"
              onPress={() => void askForSupport()}
            />
          </>
        ) : (
          <Text style={styles.meta}>
            Une personne doit d’abord accepter la permission « demandes de
            soutien ».
          </Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Activité" title="Demandes et réponses">
        {requests.length > 0 ? (
          requests.slice(0, 12).map((item) => (
            <View key={item.id} style={styles.requestItem}>
              <Text style={styles.relationshipName}>
                {supportKinds.find((kind) => kind.value === item.kind)?.label ??
                  item.kind}
              </Text>
              {item.message ? (
                <Text style={styles.permissionsSummary}>{item.message}</Text>
              ) : null}
              <Text style={styles.requestStatus}>{item.status}</Text>
              {item.caregiverId === session?.user.id &&
              item.status === "pending" ? (
                <View style={styles.responseRow}>
                  <View style={styles.flexButton}>
                    <ActionButton
                      disabled={isSaving}
                      label="Accepter"
                      onPress={() => void respond(item.id, "accepted")}
                    />
                  </View>
                  <View style={styles.flexButton}>
                    <ActionButton
                      danger
                      disabled={isSaving}
                      label="Décliner"
                      onPress={() => void respond(item.id, "declined")}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.meta}>Aucune demande pour l’instant.</Text>
        )}
      </SectionCard>

      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
      ) : null}
      {isLoading ? (
        <View accessibilityLabel="Chargement en cours" style={styles.loading}>
          <ActivityIndicator color={color.primary} />
          <Text style={styles.meta}>Mise à jour du Cercle…</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function ActionButton({
  danger = false,
  disabled,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        danger && styles.actionDanger,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionLabel, danger && styles.actionDangerLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    minHeight: 136,
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  headingCopy: { flex: 1, gap: space[2] },
  kicker: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: { color: color.ink, fontSize: 38, lineHeight: 44, fontWeight: "700" },
  visual: { width: 132, height: 112 },
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
  multiline: { minHeight: 90, textAlignVertical: "top" },
  permissionList: { gap: space[2] },
  permission: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingHorizontal: space[3],
    borderRadius: radius.medium,
    backgroundColor: color.canvas,
    borderWidth: 1,
    borderColor: color.border,
  },
  permissionSelected: {
    borderColor: color.primary,
    backgroundColor: color.primarySoft,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: color.sage,
    backgroundColor: color.surfaceStrong,
  },
  checkboxSelected: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  permissionLabel: {
    flex: 1,
    color: color.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  neverShared: {
    color: "#5E5145",
    fontSize: 12,
    lineHeight: 18,
    padding: space[3],
    borderRadius: radius.medium,
    backgroundColor: "#F8F1EA",
  },
  action: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.primary,
  },
  actionDanger: { backgroundColor: color.dangerSoft },
  actionLabel: {
    color: color.surfaceStrong,
    fontSize: 14,
    fontWeight: "800",
  },
  actionDangerLabel: { color: color.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  relationship: {
    gap: space[2],
    padding: space[4],
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: color.border,
  },
  relationshipName: { color: color.ink, fontSize: 15, fontWeight: "800" },
  meta: { color: color.inkMuted, fontSize: 13, lineHeight: 19 },
  permissionsSummary: {
    color: color.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  fieldLabel: { color: color.ink, fontSize: 14, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space[3],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceStrong,
  },
  chipSelected: {
    borderColor: color.primary,
    backgroundColor: color.primarySoft,
  },
  chipLabel: { color: color.primaryDeep, fontSize: 13, fontWeight: "700" },
  requestItem: {
    gap: space[1],
    padding: space[4],
    borderRadius: radius.medium,
    backgroundColor: color.canvas,
  },
  requestStatus: {
    color: color.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  responseRow: { flexDirection: "row", gap: space[2], marginTop: space[2] },
  flexButton: { flex: 1 },
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

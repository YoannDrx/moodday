import { MoodDayApiError } from "@moodday/api-client";
import type { GestureDto, SharingLevel, TodayDto } from "@moodday/contracts";
import { sharingLevels } from "@moodday/domain";
import { space } from "@moodday/design-tokens";
import { useCallback, useEffect, useState } from "react";
import { Alert, Share, StyleSheet, View } from "react-native";
import { Bouyotte } from "../../src/components/bouyotte";
import { GestureList } from "../../src/components/couple/gesture-list";
import { PushInviteCard } from "../../src/components/couple/push-invite-card";
import { Screen } from "../../src/components/screen";
import { TabHeaderActions } from "../../src/components/tab-header-actions";
import {
  Button,
  Card,
  ChoiceTile,
  Field,
  Notice,
  StatusText,
  Sticker,
  ToggleRow,
  Txt,
} from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";
import {
  formatInviteCode,
  formatPausedUntil,
  inviteMessage,
  isCompleteInviteCode,
  normalizeInviteInput,
  sharingPreview,
} from "../../src/lib/couple-view";
import { usePalette } from "../../src/lib/theme";
import { refreshToday, useTodayState } from "../../src/lib/today-store";

type Status = { text: string; error: boolean } | undefined;

const errorText = (error: unknown) =>
  error instanceof MoodDayApiError
    ? error.message
    : "Pas de réseau. Réessaie dès que tu es connecté·e.";

function InviteSection({
  ownerId,
  today,
}: {
  ownerId: string;
  today: TodayDto;
}) {
  const role = today.role ?? "cycle_owner";
  const isOwner = role === "cycle_owner";
  const [code, setCode] = useState<string>();
  const [entered, setEntered] = useState("");
  const [pending, setPending] = useState<"create" | "cancel" | "accept">();
  const [status, setStatus] = useState<Status>();

  const create = async () => {
    setPending("create");
    setStatus(undefined);
    try {
      const result = await api.createInvite();
      setCode(formatInviteCode(result.code));
      void refreshToday(ownerId);
    } catch (error) {
      setStatus({ text: errorText(error), error: true });
    } finally {
      setPending(undefined);
    }
  };

  const cancel = async () => {
    setPending("cancel");
    try {
      await api.cancelInvite();
      setCode(undefined);
      setStatus({ text: "Invitation annulée.", error: false });
      void refreshToday(ownerId);
    } catch (error) {
      setStatus({ text: errorText(error), error: true });
    } finally {
      setPending(undefined);
    }
  };

  const accept = async () => {
    setPending("accept");
    setStatus(undefined);
    try {
      await api.acceptInvite(entered.trim());
      setEntered("");
      setStatus({ text: "Duo formé. Bienvenue à deux !", error: false });
      await refreshToday(ownerId);
    } catch (error) {
      setStatus({
        text:
          error instanceof MoodDayApiError
            ? "Ce code ne marche pas. Vérifie-le ou demande-en un nouveau."
            : errorText(error),
        error: true,
      });
    } finally {
      setPending(undefined);
    }
  };

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: inviteMessage(role, code),
        title: "Moodday",
      });
    } catch {
      setStatus({ text: "Le partage n’a pas pu s’ouvrir.", error: true });
    }
  };

  return (
    <>
      <Card
        title={
          isOwner
            ? "Inviter mon ou ma partenaire"
            : "L’inviter à rejoindre Moodday"
        }
      >
        {code ? (
          <>
            <Txt variant="small" tone="muted">
              Valable 7 jours, utilisable une seule fois.
            </Txt>
            <Sticker fill="honey" style={styles.code}>
              <Txt
                variant="display"
                accessibilityLabel={`Code d’invitation ${code.split("").join(" ")}`}
                style={styles.codeText}
              >
                {code}
              </Txt>
            </Sticker>
            <Button
              variant="honey"
              label="Partager le code"
              onPress={() => void share()}
            />
            <Notice>{inviteMessage(role, code)}</Notice>
          </>
        ) : (
          <Button
            variant="honey"
            label={
              today.link?.status === "invited"
                ? "Générer un nouveau code"
                : "Créer un code d’invitation"
            }
            pending={pending === "create"}
            disabled={Boolean(pending)}
            onPress={() => void create()}
          />
        )}
        {today.link?.status === "invited" ? (
          <Button
            variant="ghost"
            label="Annuler l’invitation"
            pending={pending === "cancel"}
            disabled={Boolean(pending)}
            onPress={() => void cancel()}
          />
        ) : null}
      </Card>

      <Card title="J’ai reçu un code">
        <Txt variant="small" tone="muted">
          {isOwner
            ? "Ton ou ta partenaire t’a invitée ? Entre son code : tu choisiras ensuite ce qu’il ou elle voit."
            : "Elle t’a envoyé un code ? Entre-le ici."}
        </Txt>
        <Field
          label="Code d’invitation"
          value={entered}
          onChangeText={(value) => setEntered(normalizeInviteInput(value))}
          placeholder="ABCD-EFGH"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={9}
          style={styles.codeInput}
        />
        <Button
          variant="primary"
          label="Rejoindre"
          pending={pending === "accept"}
          disabled={Boolean(pending) || !isCompleteInviteCode(entered)}
          onPress={() => void accept()}
        />
      </Card>
      <StatusText tone={status?.error ? "danger" : "muted"}>
        {status?.text}
      </StatusText>
    </>
  );
}

function SharingSettings({
  ownerId,
  partnerName,
  initial,
}: {
  ownerId: string;
  partnerName: string;
  initial: {
    level: SharingLevel;
    shareSymptoms: boolean;
    detailedPreviews: boolean;
  };
}) {
  const palette = usePalette();
  const [saved, setSaved] = useState(initial);
  const [level, setLevel] = useState(initial.level);
  const [shareSymptoms, setShareSymptoms] = useState(initial.shareSymptoms);
  const [detailedPreviews, setDetailedPreviews] = useState(
    initial.detailedPreviews,
  );
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>();

  const dirty =
    level !== saved.level ||
    shareSymptoms !== saved.shareSymptoms ||
    detailedPreviews !== saved.detailedPreviews;

  const save = async () => {
    setPending(true);
    setStatus(undefined);
    try {
      const input = {
        level,
        shareSymptoms: level === "cycle_only" ? false : shareSymptoms,
        detailedPreviews,
      };
      await api.updateSharing(input);
      setShareSymptoms(input.shareSymptoms);
      setSaved(input);
      setStatus({ text: "Réglages de partage enregistrés.", error: false });
      void refreshToday(ownerId);
    } catch (error) {
      setStatus({ text: errorText(error), error: true });
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.stack}>
      <Txt variant="heading">Ce que {partnerName} voit</Txt>
      <View accessibilityRole="radiogroup" style={styles.stack}>
        {(Object.keys(sharingLevels) as SharingLevel[]).map((key) => (
          <ChoiceTile
            key={key}
            title={sharingLevels[key].label}
            description={sharingLevels[key].description}
            selected={level === key}
            background={palette.honey}
            onPress={() => setLevel(key)}
          />
        ))}
      </View>
      <ToggleRow
        label="Partager aussi mes symptômes"
        hint="Désactivé par défaut. Crampes, fatigue, irritabilité…"
        value={level !== "cycle_only" && shareSymptoms}
        disabled={level === "cycle_only"}
        onValueChange={setShareSymptoms}
      />
      <ToggleRow
        label="Notifications détaillées sur son écran verrouillé"
        hint="Sinon : « a partagé son point du jour », rien de plus."
        value={detailedPreviews}
        onValueChange={setDetailedPreviews}
      />
      <Notice>
        <Txt style={styles.bold}>Vue de {partnerName}</Txt>
        {sharingPreview(level, shareSymptoms).map((line) => (
          <Txt key={line} variant="small">
            • {line}
          </Txt>
        ))}
        <Txt variant="small" style={styles.bold}>
          Jamais : ta note privée.
        </Txt>
      </Notice>
      <Button
        variant="honey"
        label="Enregistrer"
        pending={pending}
        disabled={!dirty}
        onPress={() => void save()}
      />
      <StatusText tone={status?.error ? "danger" : "muted"}>
        {status?.text}
      </StatusText>
    </View>
  );
}

function ActiveDuo({ ownerId, today }: { ownerId: string; today: TodayDto }) {
  const link = today.link;
  const isOwner = today.role === "cycle_owner";
  const partnerName = link?.partnerName ?? "Ton duo";
  const pausedUntil = link?.pausedUntil ?? null;
  // Same reference until "Aujourd'hui" is refreshed: reloads the history then.
  const recent = isOwner ? today.owner?.gestures : today.supporter?.gestures;
  const [history, setHistory] = useState<GestureDto[]>();
  const gestures = history ?? recent ?? [];

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.listGestures());
    } catch {
      // Offline: the recent gestures from "Aujourd'hui" stay on screen.
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, recent]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>();

  if (!link) return null;

  const run = async (action: () => Promise<unknown>, success: string) => {
    setPending(true);
    setStatus(undefined);
    try {
      await action();
      setStatus({ text: success, error: false });
      await refreshToday(ownerId);
    } catch (error) {
      setStatus({ text: errorText(error), error: true });
    } finally {
      setPending(false);
    }
  };

  const confirmEnd = () =>
    Alert.alert(
      "Arrêter le partage ?",
      `${partnerName} perdra l’accès immédiatement et recevra un message neutre, sans raison. Votre historique partagé sera masqué.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui, arrêter",
          style: "destructive",
          onPress: () => void run(async () => api.endLink(), "Partage arrêté."),
        },
      ],
    );

  return (
    <>
      <PushInviteCard ownerId={ownerId} partnerName={partnerName} />
      <Sticker>
        <View style={styles.row}>
          <Bouyotte mood={pausedUntil ? "sleepy" : "happy"} size={72} />
          <View style={styles.flex}>
            <Txt variant="title">{partnerName}</Txt>
            <Txt tone="muted" style={styles.bold}>
              {pausedUntil ? "Partage en pause" : "Duo actif"}
            </Txt>
          </View>
        </View>
        {isOwner ? (
          <>
            <SharingSettings
              ownerId={ownerId}
              partnerName={partnerName}
              initial={{
                level: link.level,
                shareSymptoms: link.shareSymptoms,
                detailedPreviews: link.detailedPreviews,
              }}
            />
            {pausedUntil ? (
              <>
                <Txt style={styles.bold}>
                  En pause jusqu’à {formatPausedUntil(pausedUntil)}.
                </Txt>
                <Button
                  variant="mint"
                  label="Reprendre maintenant"
                  pending={pending}
                  onPress={() =>
                    void run(async () => api.resumeSharing(), "Partage repris.")
                  }
                />
              </>
            ) : (
              <Button
                variant="outline"
                label="⏸ Pause 48 h"
                pending={pending}
                onPress={() =>
                  void run(
                    async () => api.pauseSharing(48),
                    "Pause de 48 h activée. Rien n’est envoyé pendant ce temps.",
                  )
                }
              />
            )}
          </>
        ) : (
          <Txt>
            {partnerName} partage :{" "}
            <Txt style={styles.bold}>
              {sharingLevels[link.level].label.toLowerCase()}
            </Txt>
            . Elle peut changer ce réglage quand elle veut.
          </Txt>
        )}
        <Button
          variant="ghost"
          label="Arrêter le partage"
          disabled={pending}
          onPress={confirmEnd}
        />
        <StatusText tone={status?.error ? "danger" : "muted"}>
          {status?.text}
        </StatusText>
      </Sticker>

      <Card title="Historique des gestes">
        <GestureList
          gestures={gestures}
          partnerName={partnerName}
          canThank={isOwner}
          onChanged={() => void refreshToday(ownerId)}
          emptyText="Rien pour l’instant. Les premiers gestes arrivent avec les premiers points."
        />
      </Card>
    </>
  );
}

export default function DuoScreen() {
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const { today, status } = useTodayState();
  const isOwner = today?.role !== "supporter";
  const link = today?.link ?? null;
  const active = link?.status === "active";

  return (
    <Screen
      title="Duo"
      subtitle={
        active
          ? `${today?.displayName ?? "Toi"} & ${link.partnerName ?? "ton duo"}`
          : isOwner
            ? "Invite la personne qui partage ta vie. Tu décides de tout ce qu’elle voit."
            : "C’est elle qui choisit ce qu’elle partage. Toi, tu apprends et tu réponds."
      }
      leading={<TabHeaderActions />}
      refreshing={status === "loading"}
      onRefresh={ownerId ? () => void refreshToday(ownerId) : undefined}
    >
      {!today || !ownerId ? (
        <Txt tone="muted">Ton duo s’affichera dès le retour du réseau.</Txt>
      ) : active ? (
        <ActiveDuo ownerId={ownerId} today={today} />
      ) : (
        <InviteSection ownerId={ownerId} today={today} />
      )}
      {isOwner ? (
        <Txt variant="small" tone="muted">
          Ta note privée n’est jamais partagée, quel que soit le réglage.
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[3] },
  row: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1, gap: space[1] },
  bold: { fontWeight: "800" },
  code: { alignItems: "center" },
  codeText: { letterSpacing: 4 },
  codeInput: { fontSize: 20, letterSpacing: 3, fontWeight: "800" },
});

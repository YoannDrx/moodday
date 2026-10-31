import type { TodayDto } from "@moodday/contracts";
import { stateCatalog } from "@moodday/domain";
import { space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { CheckInDelivery } from "../../lib/offline-queue";
import { refreshPendingCount, refreshToday } from "../../lib/today-store";
import { Bouyotte } from "../bouyotte";
import { Button, Card, Notice, Row, StatusText, Sticker, Txt } from "../ui";
import { CheckInForm } from "./check-in-form";
import { GestureList } from "./gesture-list";
import { PushInviteCard } from "./push-invite-card";

type Owner = NonNullable<TodayDto["owner"]>;

export function OwnerToday({
  ownerId,
  today,
  owner,
}: {
  ownerId: string;
  today: TodayDto;
  owner: Owner;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!owner.checkIn);
  const [status, setStatus] = useState<string>();
  const link = today.link;
  const partnerName = link?.status === "active" ? link.partnerName : null;
  const paused = Boolean(link?.pausedUntil);

  const done = (delivery: CheckInDelivery) => {
    setEditing(false);
    if (delivery.status === "queued") {
      setStatus(
        "Hors ligne : ton point est gardé sur ce téléphone et partira dès le retour du réseau.",
      );
      void refreshPendingCount(ownerId);
      return;
    }
    setStatus(
      partnerName && !paused && link?.level !== "cycle_only"
        ? `C’est noté. ${partnerName} est prévenu·e en douceur.`
        : "C’est noté. Sois douce avec toi aujourd’hui.",
    );
    void refreshToday(ownerId);
  };

  return (
    <View style={styles.stack}>
      <Sticker>
        {editing ? (
          <CheckInForm
            ownerId={ownerId}
            localDate={today.localDate}
            partnerName={partnerName}
            level={link?.status === "active" ? link.level : null}
            paused={paused}
            initial={owner.checkIn}
            customNeeds={owner.customNeeds}
            onDone={done}
          />
        ) : owner.checkIn ? (
          <View style={styles.summary}>
            <Bouyotte mood={owner.checkIn.state} size={84} />
            <View style={styles.flex}>
              <Txt variant="eyebrow" tone="muted">
                Ton point du jour
              </Txt>
              <Txt variant="title">
                {stateCatalog[owner.checkIn.state].label}
              </Txt>
              <Button
                compact
                variant="outline"
                label="Modifier mon point"
                onPress={() => {
                  setStatus(undefined);
                  setEditing(true);
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.summary}>
            <Bouyotte mood="happy" size={84} />
            <View style={styles.flex}>
              <Txt variant="title">Point enregistré</Txt>
              <Txt tone="muted">Il apparaîtra ici dès le retour du réseau.</Txt>
            </View>
          </View>
        )}
        <StatusText>{status}</StatusText>
      </Sticker>

      {partnerName && !paused ? (
        <PushInviteCard ownerId={ownerId} partnerName={partnerName} />
      ) : null}

      <Card title={partnerName ? `Côté ${partnerName}` : "Ton duo"}>
        {!link ? (
          <>
            <Txt tone="muted">
              Personne n’est invité pour l’instant. Moodday marche très bien en
              solo, et encore mieux à deux.
            </Txt>
            <Button
              variant="honey"
              label="Inviter mon ou ma partenaire"
              onPress={() => router.navigate("/duo")}
            />
          </>
        ) : link.status === "invited" ? (
          <>
            <Txt tone="muted">
              Invitation envoyée, on attend que ton duo entre le code.
            </Txt>
            <Button
              variant="outline"
              label="Revoir l’invitation"
              onPress={() => router.navigate("/duo")}
            />
          </>
        ) : (
          <>
            {paused ? (
              <Notice>⏸ Partage en pause, rien n’est envoyé.</Notice>
            ) : null}
            <GestureList
              gestures={owner.gestures.slice(0, 5)}
              partnerName={partnerName}
              canThank
              onChanged={() => void refreshToday(ownerId)}
              emptyText={
                owner.checkIn
                  ? `${partnerName ?? "Ton duo"} n’a pas encore réagi. Laisse-lui une minute.`
                  : `Fais ton point : ${partnerName ?? "ton duo"} recevra des idées pour t’aider.`
              }
            />
          </>
        )}
      </Card>

      <Card fill="mint" title={owner.cycle.phaseTitle}>
        <Txt>
          {owner.cycle.pmsInsight ??
            "Après deux cycles de points, Moodday te montre quand tes journées plus difficiles ont tendance à arriver. Juste des repères, jamais un diagnostic."}
        </Txt>
        <Row>
          <Button
            compact
            variant="outline"
            label="Voir mon cycle"
            trailing="→"
            onPress={() => router.navigate("/cycle")}
          />
        </Row>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[5] },
  summary: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1, gap: space[2] },
});

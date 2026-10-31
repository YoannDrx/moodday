import { civilDateInTimeZone, localTimeInTimeZone } from "@moodday/domain";
import { useRouter } from "expo-router";
import { useState } from "react";
import { CheckInForm } from "../../src/components/couple/check-in-form";
import { OwnerToday } from "../../src/components/couple/owner-today";
import { SupporterToday } from "../../src/components/couple/supporter-today";
import { Screen } from "../../src/components/screen";
import { TabHeaderActions } from "../../src/components/tab-header-actions";
import {
  Button,
  Notice,
  StatusText,
  Sticker,
  Txt,
} from "../../src/components/ui";
import { authClient } from "../../src/lib/auth-client";
import {
  cycleLine,
  deviceTimeZone,
  formatTime,
  greeting,
} from "../../src/lib/couple-view";
import {
  dismissReplayNotice,
  refreshPendingCount,
  refreshToday,
  syncOfflineAndRefresh,
  useTodayState,
} from "../../src/lib/today-store";

const plural = (count: number, singular: string, pluralForm: string) =>
  count > 1 ? pluralForm : singular;

export default function TodayScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const { today, status, error, rememberedRole, pendingCheckIns, lastReplay } =
    useTodayState();
  const [offlineStatus, setOfflineStatus] = useState<string>();
  const timeZone = deviceTimeZone();
  const hour = Number(localTimeInTimeZone(new Date(), timeZone).slice(0, 2));
  const name = today?.displayName ?? "toi";

  const owner = today?.owner ?? null;
  const supporter = today?.supporter ?? null;
  const partner = supporter?.partner ?? null;

  const subtitle = owner
    ? cycleLine(owner.cycle)
    : supporter
      ? partner?.status === "active" && partner.today
        ? `${partner.ownerName} a partagé son point à ${formatTime(partner.today.sharedAt)}.`
        : partner
          ? `Le duo avec ${partner.ownerName} est actif.`
          : "Tu n’es pas encore relié·e à ta ou ton partenaire."
      : undefined;

  return (
    <Screen
      title={
        supporter
          ? `Salut ${name}`
          : today
            ? greeting(name, hour)
            : "Aujourd’hui"
      }
      subtitle={subtitle}
      leading={<TabHeaderActions />}
      refreshing={status === "loading"}
      onRefresh={
        ownerId ? () => void syncOfflineAndRefresh(ownerId) : undefined
      }
      testID="today-screen"
    >
      {pendingCheckIns > 0 ? (
        <Notice>
          {`${pendingCheckIns} ${plural(pendingCheckIns, "point attend", "points attendent")} le retour du réseau. Ils partiront tout seuls, sans doublon.`}
        </Notice>
      ) : null}
      {lastReplay ? (
        <Sticker fill="mint" shadow={false}>
          <Txt>
            {lastReplay.sent > 0
              ? `Réseau retrouvé : ${lastReplay.sent} ${plural(lastReplay.sent, "point envoyé", "points envoyés")}.`
              : ""}
            {lastReplay.dropped > 0
              ? ` ${lastReplay.dropped} ${plural(lastReplay.dropped, "point n’a pas pu être accepté", "points n’ont pas pu être acceptés")} par le serveur.`
              : ""}
          </Txt>
          <Button
            compact
            variant="ghost"
            label="OK"
            onPress={dismissReplayNotice}
          />
        </Sticker>
      ) : null}

      {ownerId && owner && today ? (
        <OwnerToday ownerId={ownerId} today={today} owner={owner} />
      ) : null}
      {ownerId && supporter ? (
        <SupporterToday ownerId={ownerId} supporter={supporter} />
      ) : null}

      {!today && status === "error" ? (
        <Sticker>
          <Txt variant="title">
            {error === "offline"
              ? "Pas de réseau"
              : "Petit souci de notre côté"}
          </Txt>
          <Txt tone="muted">
            {error === "offline"
              ? rememberedRole === "cycle_owner"
                ? "Tu peux quand même faire ton point : il restera sur ce téléphone et partira dès le retour du réseau."
                : "Les nouvelles de ton duo arriveront dès le retour du réseau."
              : "Aujourd’hui n’a pas pu se charger. Réessaie dans un instant."}
          </Txt>
          <Button
            variant="outline"
            label="Réessayer"
            onPress={() => {
              if (ownerId) void refreshToday(ownerId);
            }}
          />
        </Sticker>
      ) : null}

      {!today &&
      error === "offline" &&
      rememberedRole === "cycle_owner" &&
      ownerId ? (
        <Sticker>
          <CheckInForm
            ownerId={ownerId}
            localDate={civilDateInTimeZone(new Date(), timeZone)}
            partnerName={null}
            level={null}
            paused={false}
            initial={null}
            onDone={(delivery) => {
              setOfflineStatus(
                delivery.status === "queued"
                  ? "Ton point est gardé sur ce téléphone. Il partira dès le retour du réseau."
                  : "C’est noté. Sois douce avec toi aujourd’hui.",
              );
              void refreshPendingCount(ownerId);
              if (delivery.status === "saved") void refreshToday(ownerId);
            }}
          />
          <StatusText>{offlineStatus}</StatusText>
        </Sticker>
      ) : null}

      {today && !owner && !supporter ? (
        <Button
          variant="honey"
          label="Terminer mon arrivée"
          onPress={() => router.replace("/onboarding")}
        />
      ) : null}
    </Screen>
  );
}

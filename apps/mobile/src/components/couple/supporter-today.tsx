import type { TodayDto } from "@moodday/contracts";
import { space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { refreshToday } from "../../lib/today-store";
import { Bouyotte } from "../bouyotte";
import { Button, Card, Sticker, Txt } from "../ui";
import { GestureList } from "./gesture-list";
import { GesturePanel } from "./gesture-panel";
import { PushInviteCard } from "./push-invite-card";

type Supporter = NonNullable<TodayDto["supporter"]>;

const fallbackSuggestions = [
  { key: "thinking_of_you", label: "Je pense à toi" },
  { key: "here", label: "Je suis là" },
];

export function SupporterToday({
  ownerId,
  supporter,
}: {
  ownerId: string;
  supporter: Supporter;
}) {
  const router = useRouter();
  const partner = supporter.partner;
  const refresh = () => void refreshToday(ownerId);

  return (
    <View style={styles.stack}>
      {!partner ? (
        <Sticker>
          <View style={styles.row}>
            <Bouyotte mood="wink" size={84} />
            <View style={styles.flex}>
              <Txt variant="title">Invite-la, ou entre son code</Txt>
            </View>
          </View>
          <Txt tone="muted">
            C’est elle qui crée son espace et choisit ce qu’elle partage. En
            attendant, le Programme Allié t’attend.
          </Txt>
          <Button
            variant="honey"
            label="Former notre duo"
            onPress={() => router.navigate("/duo")}
          />
        </Sticker>
      ) : partner.status === "paused" ? (
        <Sticker>
          <View style={styles.row}>
            <Bouyotte mood="sleepy" size={72} />
            <Txt variant="heading" style={styles.flex}>
              {partner.ownerName} a mis le partage en pause. Rien à faire, juste
              à être là.
            </Txt>
          </View>
        </Sticker>
      ) : (
        <>
          <PushInviteCard ownerId={ownerId} partnerName={partner.ownerName} />
          <Sticker testID="partner-day">
            {partner.today ? (
              <>
                <View style={styles.row}>
                  <Bouyotte mood={partner.today.state} size={80} />
                  <View style={styles.flex}>
                    <Txt variant="eyebrow" tone="muted">
                      Son point du jour
                    </Txt>
                    <Txt variant="title">{partner.today.stateLabel}</Txt>
                  </View>
                </View>
                {partner.today.needs.length > 0 ? (
                  <Txt variant="heading">
                    {partner.ownerName} aimerait :{" "}
                    {partner.today.needs
                      .map((need) => need.label.toLowerCase())
                      .join(", ")}
                    .
                  </Txt>
                ) : null}
                {partner.today.symptoms.length > 0 ? (
                  <Txt variant="small">
                    Elle a noté :{" "}
                    {partner.today.symptoms.join(", ").toLowerCase()}
                  </Txt>
                ) : null}
                <Txt variant="heading">Ce que tu peux faire</Txt>
                <GesturePanel
                  checkInId={partner.today.checkInId}
                  suggestions={partner.today.suggestions.slice(0, 3)}
                  ownerName={partner.ownerName}
                  onSent={refresh}
                />
              </>
            ) : (
              <>
                <Bouyotte mood="sleepy" size={72} />
                <Txt variant="title">
                  {partner.checkedInPrivately
                    ? `${partner.ownerName} a fait son point, en privé.`
                    : "Pas de point aujourd’hui."}
                </Txt>
                <Txt tone="muted">
                  {partner.checkedInPrivately
                    ? "Son niveau de partage garde les détails pour elle. Tu peux quand même envoyer une attention."
                    : "Pas de nouvelles, peut-être bonne nouvelle. Tu peux quand même envoyer une attention."}
                </Txt>
                <GesturePanel
                  checkInId={null}
                  suggestions={fallbackSuggestions}
                  ownerName={partner.ownerName}
                  onSent={refresh}
                />
              </>
            )}
          </Sticker>

          {partner.today && partner.today.avoid.length > 0 ? (
            <Card fill="apricot" title="À éviter aujourd’hui">
              {partner.today.avoid.map((hint) => (
                <Txt key={hint}>• {hint}</Txt>
              ))}
            </Card>
          ) : null}

          <Card title="Son cycle">
            <Txt>{partner.phaseText ?? "Cycle encore à découvrir."}</Txt>
            {partner.daysUntilNextPeriod !== null &&
            partner.daysUntilNextPeriod > 0 ? (
              <Txt variant="small" tone="muted">
                Règles prévues dans environ {partner.daysUntilNextPeriod} jour
                {partner.daysUntilNextPeriod === 1 ? "" : "s"}. Une estimation,
                pas une météo de son humeur.
              </Txt>
            ) : null}
          </Card>

          <Card title="Vos derniers gestes">
            <GestureList
              gestures={supporter.gestures.slice(0, 4)}
              partnerName={partner.ownerName}
              canThank={false}
              emptyText="Aucun geste pour l’instant. Le premier est souvent le plus apprécié."
            />
          </Card>
        </>
      )}

      {supporter.nextLesson ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Programme Allié, jour ${supporter.nextLesson.day} sur 7 : ${supporter.nextLesson.title}`}
          onPress={() =>
            router.push({
              pathname: "/lesson/[slug]",
              params: { slug: supporter.nextLesson?.slug ?? "" },
            })
          }
        >
          <Sticker fill="ink">
            <Txt variant="eyebrow" tone="inverse">
              Programme Allié · Jour {supporter.nextLesson.day}/7 · 2 min
            </Txt>
            <Txt variant="title" tone="inverse">
              {supporter.nextLesson.title} →
            </Txt>
          </Sticker>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[5] },
  row: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1, gap: space[1] },
});

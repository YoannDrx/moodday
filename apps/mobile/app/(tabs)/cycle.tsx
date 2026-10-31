import { MoodDayApiError, type PeriodDto } from "@moodday/api-client";
import { addDays, computeCycle } from "@moodday/domain";
import { space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Bouyotte } from "../../src/components/bouyotte";
import { Screen } from "../../src/components/screen";
import { TabHeaderActions } from "../../src/components/tab-header-actions";
import {
  Button,
  Card,
  Row,
  StatusText,
  Sticker,
  Txt,
} from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";
import {
  formatCivilDate,
  guidedPhases,
  phaseGuide,
} from "../../src/lib/couple-view";
import { usePalette } from "../../src/lib/theme";
import { refreshToday, useTodayState } from "../../src/lib/today-store";

function OwnerCycle({ ownerId }: { ownerId: string }) {
  const { today } = useTodayState();
  const cycle = today?.owner?.cycle;
  const [periods, setPeriods] = useState<PeriodDto[]>();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean }>();

  const loadPeriods = useCallback(async () => {
    try {
      setPeriods(await api.getPeriods());
    } catch {
      setStatus({
        text: "Tes règles notées s’afficheront dès le retour du réseau.",
        error: false,
      });
    }
  }, []);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  if (!today || !cycle) return null;

  const run = async (action: () => Promise<unknown>, success: string) => {
    setPending(true);
    setStatus(undefined);
    try {
      await action();
      setStatus({ text: success, error: false });
      await Promise.all([refreshToday(ownerId), loadPeriods()]);
    } catch (error) {
      setStatus({
        text:
          error instanceof MoodDayApiError
            ? error.message
            : "Pas de réseau : rien n’a été enregistré. Réessaie quand tu es connectée.",
        error: true,
      });
    } finally {
      setPending(false);
    }
  };

  // Averages are recomputed locally from her own periods, for display only.
  const local = periods
    ? computeCycle({ today: today.localDate, periods })
    : undefined;

  return (
    <>
      <Sticker fill="honey">
        <View style={styles.row}>
          <Bouyotte
            mood={
              cycle.phase === "period" || cycle.phase === "before"
                ? "sleepy"
                : "happy"
            }
            size={80}
          />
          <View style={styles.flex}>
            <Txt variant="eyebrow" tone="muted">
              Aujourd’hui
            </Txt>
            <Txt variant="title">{cycle.phaseTitle}</Txt>
            {cycle.cycleDay ? (
              <Txt>Jour {cycle.cycleDay} de ton cycle</Txt>
            ) : null}
          </View>
        </View>
        {cycle.periodOngoing ? (
          <Button
            variant="primary"
            label="Mes règles sont finies"
            pending={pending}
            onPress={() =>
              void run(
                async () => api.endPeriod(today.localDate),
                "C’est noté, fin des règles enregistrée.",
              )
            }
          />
        ) : (
          <Row>
            <Button
              variant="primary"
              label="Mes règles ont commencé"
              pending={pending}
              onPress={() =>
                void run(
                  async () => api.startPeriod(today.localDate),
                  "C’est noté. Bouillotte conseillée.",
                )
              }
            />
            <Button
              variant="ghost"
              label="C’était hier"
              disabled={pending}
              onPress={() =>
                void run(
                  async () => api.startPeriod(addDays(today.localDate, -1)),
                  "C’est noté pour hier.",
                )
              }
            />
          </Row>
        )}
        <StatusText tone={status?.error ? "danger" : "muted"}>
          {status?.text}
        </StatusText>
      </Sticker>

      <Card fill="mint" title="Tes repères">
        <Row style={styles.stats}>
          <View style={styles.stat}>
            <Txt variant="eyebrow" tone="muted">
              Cycle moyen
            </Txt>
            <Txt variant="title">
              {local ? `${local.averageCycleLength} j` : "…"}
            </Txt>
          </View>
          <View style={styles.stat}>
            <Txt variant="eyebrow" tone="muted">
              Règles
            </Txt>
            <Txt variant="title">
              {local ? `${local.averagePeriodLength} j` : "…"}
            </Txt>
          </View>
        </Row>
        <Txt variant="eyebrow" tone="muted">
          Prochaines règles
        </Txt>
        <Txt style={styles.bold}>
          {cycle.nextPeriodStart
            ? formatCivilDate(cycle.nextPeriodStart)
            : "À découvrir"}
          {cycle.confidence === "low"
            ? " (estimation encore approximative)"
            : ""}
        </Txt>
        <Txt variant="small">
          {cycle.pmsInsight ??
            "Fais ton point quelques jours par cycle : après deux cycles, Moodday te montre quand les journées plus difficiles ont tendance à arriver."}
        </Txt>
      </Card>

      <Card title="Règles notées">
        {!periods ? (
          <Txt variant="small" tone="muted">
            Chargement…
          </Txt>
        ) : periods.length === 0 ? (
          <Txt variant="small" tone="muted">
            Aucune pour l’instant.
          </Txt>
        ) : (
          periods.slice(0, 8).map((period) => (
            <Txt key={period.id} style={styles.bold}>
              Du {formatCivilDate(period.startDate, true)}
              {period.endDate
                ? ` au ${formatCivilDate(period.endDate, true)}`
                : " (en cours)"}
            </Txt>
          ))
        )}
      </Card>
    </>
  );
}

function PartnerCycle() {
  const router = useRouter();
  const palette = usePalette();
  const { today } = useTodayState();
  const partner = today?.supporter?.partner ?? null;

  if (!partner)
    return (
      <Sticker>
        <View style={styles.row}>
          <Bouyotte mood="sleepy" size={72} />
          <Txt style={styles.flex}>
            Rien à afficher tant que vous n’êtes pas relié·e·s.
          </Txt>
        </View>
        <Button
          variant="honey"
          label="Former votre duo"
          onPress={() => router.navigate("/duo")}
        />
      </Sticker>
    );

  if (partner.status === "paused")
    return (
      <Sticker>
        <Txt variant="heading">
          {partner.ownerName} a mis le partage en pause.
        </Txt>
      </Sticker>
    );

  const phase = partner.phase ?? "unknown";
  return (
    <>
      <Sticker fill="honey">
        <Txt variant="eyebrow" tone="muted">
          Aujourd’hui
        </Txt>
        <Txt variant="title">
          {partner.phaseText ?? "Cycle encore à découvrir."}
        </Txt>
        {partner.daysUntilNextPeriod !== null &&
        partner.daysUntilNextPeriod > 0 ? (
          <Txt>
            Règles prévues dans environ {partner.daysUntilNextPeriod} jour
            {partner.daysUntilNextPeriod === 1 ? "" : "s"}.
          </Txt>
        ) : null}
        <Txt variant="small">
          Une estimation, qui ne dit rien de son humeur. Pour ça, il y a son
          point du jour.
        </Txt>
      </Sticker>
      {guidedPhases.map((key) => {
        const current = key === phase;
        return (
          <Sticker
            key={key}
            background={current ? palette.honeySoft : undefined}
          >
            <Txt variant="heading">
              {phaseGuide[key].title}
              {current ? " · en ce moment" : ""}
            </Txt>
            <Txt>
              <Txt style={styles.bold}>Pour elle : </Txt>
              {phaseGuide[key].her}
            </Txt>
            <Txt>
              <Txt style={styles.bold}>Pour toi : </Txt>
              {phaseGuide[key].you}
            </Txt>
          </Sticker>
        );
      })}
    </>
  );
}

export default function CycleScreen() {
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const { today, status } = useTodayState();
  const isSupporter = today?.role === "supporter";
  const ownerName = today?.supporter?.partner?.ownerName;

  return (
    <Screen
      title={
        isSupporter
          ? ownerName
            ? `Le cycle de ${ownerName}`
            : "Son cycle"
          : "Mon cycle"
      }
      subtitle={
        isSupporter
          ? "En lecture seule. C’est elle qui renseigne tout."
          : today?.owner?.cycle.cycleDay
            ? `Jour ${today.owner.cycle.cycleDay} · ${today.owner.cycle.phaseTitle.toLowerCase()}`
            : "Note tes prochaines règles pour démarrer."
      }
      leading={<TabHeaderActions />}
      refreshing={status === "loading"}
      onRefresh={ownerId ? () => void refreshToday(ownerId) : undefined}
    >
      {!today ? (
        <Txt tone="muted">Ton cycle s’affichera dès le retour du réseau.</Txt>
      ) : isSupporter ? (
        <PartnerCycle />
      ) : ownerId ? (
        <OwnerCycle ownerId={ownerId} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1, gap: space[1] },
  stats: { gap: space[6] },
  stat: { gap: space[1] },
  bold: { fontWeight: "800" },
});

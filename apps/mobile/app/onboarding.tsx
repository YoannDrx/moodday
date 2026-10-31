import { MoodDayApiError } from "@moodday/api-client";
import type { MooddayRole } from "@moodday/contracts";
import {
  addDays,
  allyLessons,
  needCatalog,
  symptomCatalog,
} from "@moodday/domain";
import { space } from "@moodday/design-tokens";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Bouyotte } from "../src/components/bouyotte";
import { Screen } from "../src/components/screen";
import {
  Button,
  Chip,
  ChipGroup,
  ChoiceTile,
  Field,
  Row,
  StatusText,
  Stepper,
  Sticker,
  ToggleRow,
  Txt,
} from "../src/components/ui";
import { api } from "../src/lib/api";
import { authClient } from "../src/lib/auth-client";
import { formatCivilDate, toggleWithLimit } from "../src/lib/couple-view";
import { usePalette } from "../src/lib/theme";
import { refreshToday, useTodayState } from "../src/lib/today-store";

const focusOptions = [
  { key: "understand", label: "Comprendre ce qui se passe vraiment" },
  { key: "words", label: "Savoir quoi dire (et quoi éviter)" },
  { key: "help", label: "Aider concrètement, sans en faire trop" },
  { key: "arguments", label: "Éviter la dispute du mois" },
  { key: "serious", label: "Repérer quand ça devient sérieux" },
];

const roleOptions: { value: MooddayRole; title: string; text: string }[] = [
  {
    value: "cycle_owner",
    title: "C’est mon cycle",
    text: "Je fais mon point, je choisis ce que je partage.",
  },
  {
    value: "supporter",
    title: "C’est le cycle de ma ou mon partenaire",
    text: "Je veux comprendre et savoir comment aider.",
  },
];

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.step}>
      <Txt variant="title" accessibilityRole="header">
        {title}
      </Txt>
      {hint ? <Txt tone="muted">{hint}</Txt> : null}
      {children}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { data: session, isPending } = authClient.useSession();
  const ownerId = session?.user.id;
  const { today } = useTodayState();
  const [role, setRole] = useState<MooddayRole | null>(today?.role ?? null);
  const [preselected, setPreselected] = useState<MooddayRole | null>(
    today?.role ?? null,
  );
  const [step, setStep] = useState(0);
  const [name, setName] = useState(
    today?.displayName ?? session?.user.name.split(" ")[0] ?? "",
  );
  const [daysAgo, setDaysAgo] = useState(7);
  const [unknownDate, setUnknownDate] = useState(false);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [hardest, setHardest] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (ownerId && !today) void refreshToday(ownerId);
  }, [ownerId, today]);

  useEffect(() => {
    if (today?.role && !role) {
      setRole(today.role);
      setPreselected(today.role);
    }
  }, [today?.role, role]);

  if (!isPending && !ownerId) return <Redirect href="/sign-in" />;

  const localDate = today?.localDate ?? new Date().toISOString().slice(0, 10);

  const fail = (caught: unknown, fallback: string) =>
    setError(caught instanceof MoodDayApiError ? caught.message : fallback);

  const confirmRole = async (next: MooddayRole) => {
    setPending(true);
    setError(undefined);
    try {
      await api.chooseRole(next);
      setRole(next);
      setStep(0);
    } catch (caught) {
      fail(caught, "Pas de réseau : réessaie dans un instant.");
    } finally {
      setPending(false);
    }
  };

  const finish = async () => {
    if (!ownerId || !role) return;
    setPending(true);
    setError(undefined);
    try {
      if (role === "cycle_owner") {
        await api.completeOwnerOnboarding({
          displayName: name.trim(),
          lastPeriodStart: unknownDate ? null : addDays(localDate, -daysAgo),
          typicalCycleLength: cycleLength,
          typicalPeriodLength: periodLength,
          hardestThings: hardest,
          usualNeeds: needs,
        });
      } else {
        await api.completeSupporterOnboarding({
          displayName: name.trim(),
          supporterFocus: focus,
        });
      }
      await refreshToday(ownerId);
      if (role === "cycle_owner") router.replace("/");
      else {
        router.replace("/");
        router.push({
          pathname: "/lesson/[slug]",
          params: { slug: allyLessons[0].slug },
        });
      }
    } catch (caught) {
      fail(caught, "Pas de réseau : tes réponses sont gardées ici, réessaie.");
    } finally {
      setPending(false);
    }
  };

  if (!role) {
    return (
      <Screen>
        <View style={styles.hero}>
          <Bouyotte mood="happy" steam size={96} />
          <Txt variant="display" accessibilityRole="header" style={styles.flex}>
            Bienvenue ! Tu es de quel côté du duo ?
          </Txt>
        </View>
        <View accessibilityRole="radiogroup" style={styles.step}>
          {roleOptions.map((option) => (
            <ChoiceTile
              key={option.value}
              title={option.title}
              description={option.text}
              selected={preselected === option.value}
              background={palette.honey}
              onPress={() => setPreselected(option.value)}
            />
          ))}
        </View>
        <Txt variant="small" tone="muted">
          Un compte, un côté. Tu pourras changer plus tard tant que tu n’es pas
          relié·e à quelqu’un.
        </Txt>
        <StatusText tone="danger">{error}</StatusText>
        <Button
          variant="primary"
          label="Continuer"
          trailing="→"
          pending={pending}
          disabled={!preselected}
          onPress={() => {
            if (preselected) void confirmRole(preselected);
          }}
        />
      </Screen>
    );
  }

  const nameStep = (
    <Step
      key="name"
      title="Comment on t’appelle ?"
      hint={
        role === "cycle_owner"
          ? "C’est ce que verra ton duo."
          : "C’est ce que verra ta ou ton partenaire."
      }
    >
      <Field
        label="Prénom ou surnom"
        value={name}
        maxLength={40}
        onChangeText={setName}
        autoComplete="given-name"
      />
    </Step>
  );

  const ownerSteps = [
    nameStep,
    <Step
      key="period"
      title="Tes dernières règles ont commencé quand ?"
      hint="Une date approximative suffit. Moodday s’affinera avec le temps."
    >
      {!unknownDate ? (
        <>
          <Stepper
            label="Il y a"
            value={daysAgo}
            min={0}
            max={60}
            onChange={setDaysAgo}
            format={(value) =>
              value === 0
                ? "aujourd’hui"
                : `${value} jour${value > 1 ? "s" : ""}`
            }
          />
          <Txt style={styles.bold}>
            Soit le {formatCivilDate(addDays(localDate, -daysAgo))}
          </Txt>
        </>
      ) : null}
      <ToggleRow
        label="Je ne sais plus, je la noterai la prochaine fois"
        value={unknownDate}
        onValueChange={setUnknownDate}
      />
    </Step>,
    <Step
      key="length"
      title="Ton rythme habituel"
      hint="Si tu ne sais pas, laisse les valeurs par défaut."
    >
      <Stepper
        label="Durée d’un cycle"
        value={cycleLength}
        min={21}
        max={45}
        onChange={setCycleLength}
        format={(value) => `${value} jours`}
      />
      <Stepper
        label="Durée des règles"
        value={periodLength}
        min={2}
        max={10}
        onChange={setPeriodLength}
        format={(value) => `${value} jours`}
      />
    </Step>,
    <Step
      key="hard"
      title="Avant tes règles, qu’est-ce qui est le plus dur ?"
      hint="Trois maximum. Ça sert à te proposer les bons raccourcis."
    >
      <ChipGroup>
        {symptomCatalog.map((symptom) => (
          <Chip
            key={symptom.key}
            label={symptom.label}
            selected={hardest.includes(symptom.key)}
            onPress={() =>
              setHardest((list) => toggleWithLimit(list, symptom.key, 3))
            }
          />
        ))}
      </ChipGroup>
    </Step>,
    <Step
      key="needs"
      title="Et dans ces moments-là, de quoi as-tu besoin ?"
      hint="Ton duo recevra des idées de gestes à partir de ça."
    >
      <ChipGroup>
        {needCatalog.map((need) => (
          <Chip
            key={need.key}
            label={need.label}
            selected={needs.includes(need.key)}
            onPress={() =>
              setNeeds((list) => toggleWithLimit(list, need.key, 4))
            }
          />
        ))}
      </ChipGroup>
    </Step>,
  ];

  const supporterSteps = [
    nameStep,
    <Step
      key="focus"
      title="Qu’est-ce que tu aimerais mieux comprendre ?"
      hint="Trois choix maximum. Aucune mauvaise réponse, promis."
    >
      <ChipGroup>
        {focusOptions.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            selected={focus.includes(option.key)}
            onPress={() =>
              setFocus((list) => toggleWithLimit(list, option.key, 3))
            }
          />
        ))}
      </ChipGroup>
    </Step>,
  ];

  const steps = role === "cycle_owner" ? ownerSteps : supporterSteps;
  const last = step === steps.length - 1;
  const canContinue =
    name.trim().length > 0 &&
    (role !== "supporter" || step === 0 || focus.length > 0);

  return (
    <Screen>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Progression"
        accessibilityValue={{ min: 1, max: steps.length, now: step + 1 }}
        style={styles.progress}
      >
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressStep,
              {
                borderColor: palette.border,
                backgroundColor:
                  index <= step ? palette.ink : palette.surfaceStrong,
              },
            ]}
          />
        ))}
      </View>
      <Sticker>{steps[step]}</Sticker>
      <StatusText tone="danger">{error}</StatusText>
      <Row style={styles.actions}>
        <Button
          variant="ghost"
          label="← Retour"
          disabled={pending || (step === 0 && Boolean(today?.role))}
          onPress={() => (step === 0 ? setRole(null) : setStep(step - 1))}
        />
        <Button
          variant={last ? "honey" : "primary"}
          label={
            last
              ? role === "cycle_owner"
                ? "Faire mon premier point"
                : "Commencer le jour 1"
              : "Continuer"
          }
          trailing="→"
          pending={pending}
          disabled={!canContinue}
          onPress={() => (last ? void finish() : setStep(step + 1))}
        />
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1 },
  step: { gap: space[4] },
  bold: { fontWeight: "800" },
  progress: { flexDirection: "row", gap: space[2] },
  progressStep: { flex: 1, height: 10, borderWidth: 1, borderRadius: 999 },
  actions: { justifyContent: "space-between" },
});

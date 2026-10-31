import type { CheckInDto, SharingLevel } from "@moodday/contracts";
import {
  checkInStates,
  customNeedKey,
  needCatalog,
  stateCatalog,
  symptomCatalog,
  type CheckInStateKey,
} from "@moodday/domain";
import { space, stateColor } from "@moodday/design-tokens";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  MAX_NEEDS,
  MAX_SYMPTOMS,
  deviceTimeZone,
  partnerPreview,
  toggleWithLimit,
} from "../../lib/couple-view";
import {
  newOperationId,
  submitCheckIn,
  type CheckInDelivery,
} from "../../lib/offline-queue";
import { Bouyotte } from "../bouyotte";
import {
  Button,
  Chip,
  ChipGroup,
  ChoiceTile,
  Field,
  Notice,
  StatusText,
  Txt,
} from "../ui";

const VISIBLE_SYMPTOMS = 6;

export function CheckInForm({
  ownerId,
  localDate,
  partnerName,
  level,
  paused,
  initial,
  customNeeds = [],
  onDone,
}: {
  ownerId: string;
  localDate: string;
  partnerName: string | null;
  level: SharingLevel | null;
  paused: boolean;
  initial: CheckInDto | null;
  customNeeds?: readonly { id: string; label: string }[];
  onDone: (delivery: CheckInDelivery) => void;
}) {
  const [state, setState] = useState<CheckInStateKey | null>(
    initial?.state ?? null,
  );
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [needs, setNeeds] = useState<string[]>(initial?.needs ?? []);
  const [note, setNote] = useState(initial?.privateNote ?? "");
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const symptomList = showAllSymptoms
    ? symptomCatalog
    : symptomCatalog.filter(
        (symptom, index) =>
          index < VISIBLE_SYMPTOMS || symptoms.includes(symptom.key),
      );
  const allNeeds = [
    ...needCatalog,
    ...customNeeds.map((need) => ({
      key: customNeedKey(need.id),
      label: need.label,
    })),
  ];
  const preview = partnerPreview({
    partnerName,
    level,
    paused,
    state,
    needs,
    customNeeds,
  });

  const save = async () => {
    if (!state || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const delivery = await submitCheckIn(ownerId, {
        operationId: newOperationId(),
        localDate,
        timezone: deviceTimeZone(),
        state,
        symptoms,
        needs,
        privateNote: note.trim() || null,
      });
      onDone(delivery);
    } catch {
      setError(
        "Quelque chose cloche dans ce point, il n’a pas été enregistré. Réessaie ?",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.group} accessibilityRole="radiogroup">
        <Txt variant="title" accessibilityRole="header">
          Comment tu te sens ?
        </Txt>
        <View style={styles.states}>
          {checkInStates.map((key) => (
            <ChoiceTile
              key={key}
              title={stateCatalog[key].label}
              description={stateCatalog[key].hint}
              selected={state === key}
              background={stateColor[key]}
              onPress={() => setState(key)}
              testID={`check-in-state-${key}`}
            >
              <Bouyotte mood={key} size={64} />
            </ChoiceTile>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Txt variant="heading">
          Ton corps et ta tête{" "}
          <Txt tone="muted" variant="small">
            (facultatif)
          </Txt>
        </Txt>
        <ChipGroup>
          {symptomList.map((symptom) => (
            <Chip
              key={symptom.key}
              label={symptom.label}
              selected={symptoms.includes(symptom.key)}
              onPress={() =>
                setSymptoms((list) =>
                  toggleWithLimit(list, symptom.key, MAX_SYMPTOMS),
                )
              }
            />
          ))}
          {!showAllSymptoms ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllSymptoms(true)}
              style={styles.more}
            >
              <Txt style={styles.underline}>Plus…</Txt>
            </Pressable>
          ) : null}
        </ChipGroup>
      </View>

      <View style={styles.group}>
        <Txt variant="heading">
          Ce qui t’aiderait{" "}
          <Txt tone="muted" variant="small">
            (deux maximum)
          </Txt>
        </Txt>
        <ChipGroup>
          {allNeeds.map((need) => {
            const selected = needs.includes(need.key);
            return (
              <Chip
                key={need.key}
                label={need.label}
                selected={selected}
                disabled={!selected && needs.length >= MAX_NEEDS}
                onPress={() =>
                  setNeeds((list) => toggleWithLimit(list, need.key, MAX_NEEDS))
                }
              />
            );
          })}
        </ChipGroup>
        {preview ? <Notice>{preview}</Notice> : null}
      </View>

      <Field
        label="🔒 Note privée"
        accessibilityLabel="Note privée"
        hint="Rien que pour toi. Jamais partagée, avec personne."
        multiline
        maxLength={1000}
        value={note}
        onChangeText={setNote}
        placeholder="Ce que tu veux garder pour toi…"
      />

      <StatusText tone="danger">{error}</StatusText>
      <Button
        variant="honey"
        testID="check-in-submit"
        label={
          pending
            ? "Enregistrement…"
            : initial
              ? "Mettre à jour mon point"
              : "Enregistrer mon point"
        }
        disabled={!state}
        pending={pending}
        onPress={() => void save()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space[6] },
  group: { gap: space[3] },
  states: { flexDirection: "row", flexWrap: "wrap", gap: space[3] },
  more: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space[2],
  },
  underline: { textDecorationLine: "underline", fontWeight: "800" },
});

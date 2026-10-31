import { MoodDayApiError } from "@moodday/api-client";
import type { AllyLessonDto } from "@moodday/contracts";
import { allyLessons } from "@moodday/domain";
import { space } from "@moodday/design-tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Bouyotte } from "../../src/components/bouyotte";
import { LessonBody } from "../../src/components/lesson-body";
import { Screen } from "../../src/components/screen";
import {
  Button,
  Card,
  ChoiceTile,
  StatusText,
  Sticker,
  Txt,
} from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";
import { usePalette } from "../../src/lib/theme";
import { refreshToday } from "../../src/lib/today-store";

export default function LessonScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const [lesson, setLesson] = useState<AllyLessonDto>();
  const [loadError, setLoadError] = useState<string>();
  const [choice, setChoice] = useState<number>();
  const [completed, setCompleted] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean }>();

  const load = useCallback(async () => {
    if (typeof slug !== "string") return;
    setLoadError(undefined);
    try {
      const next = await api.getLesson(slug);
      setLesson(next);
      setCompleted(next.completed);
    } catch (error) {
      setLoadError(
        error instanceof MoodDayApiError
          ? "Cette leçon n’existe pas, ou plus."
          : "Pas de réseau : la leçon s’affichera dès ton retour en ligne.",
      );
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const back = (
    <Button
      compact
      variant="ghost"
      label="← Programme Allié"
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace("/ally")
      }
    />
  );

  if (!lesson)
    return (
      <Screen title="Programme Allié" leading={back}>
        {loadError ? (
          <Sticker>
            <Txt>{loadError}</Txt>
            <Button
              variant="outline"
              label="Réessayer"
              onPress={() => void load()}
            />
          </Sticker>
        ) : (
          <ActivityIndicator
            accessibilityLabel="Chargement de la leçon"
            color={palette.ink}
          />
        )}
      </Screen>
    );

  const total = allyLessons.length;
  const next = allyLessons.find((item) => item.day === lesson.day + 1);
  const answered = choice !== undefined;
  const correct = choice === lesson.quizAnswer;

  const complete = async () => {
    setPending(true);
    setStatus(undefined);
    try {
      await api.completeLesson(lesson.slug);
      setCompleted(true);
      setStatus({
        text:
          lesson.day === total
            ? "Programme terminé. Bravo, sincèrement."
            : "Leçon validée. À demain pour la suite ?",
        error: false,
      });
      if (ownerId) void refreshToday(ownerId);
    } catch (error) {
      setStatus({
        text:
          error instanceof MoodDayApiError
            ? error.message
            : "Pas de réseau : la leçon n’a pas été validée. Réessaie plus tard.",
        error: true,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen
      title={lesson.title}
      subtitle={`Jour ${lesson.day}/${total} · 2 minutes`}
      leading={back}
      testID="lesson-screen"
    >
      <Sticker>
        <LessonBody source={lesson.body} />
      </Sticker>

      {lesson.tryThis ? (
        <Card fill="mint" title="💡 Essaie ça cette semaine">
          <Txt>{lesson.tryThis}</Txt>
        </Card>
      ) : null}

      <Card title="Petit quiz">
        <Txt style={styles.bold}>{lesson.quizQuestion}</Txt>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {lesson.quizOptions.map((option, index) => (
            <ChoiceTile
              key={option}
              title={option}
              selected={choice === index}
              background={
                index === lesson.quizAnswer ? palette.mint : palette.apricot
              }
              onPress={() => setChoice(index)}
            />
          ))}
        </View>
        {answered ? (
          <Txt accessibilityLiveRegion="polite" style={styles.bold}>
            {correct
              ? "Exactement. Tu peux terminer la leçon."
              : "Pas tout à fait. Relis la leçon et retente ta chance."}
          </Txt>
        ) : null}
      </Card>

      <View style={styles.row}>
        <Bouyotte mood={completed ? "happy" : "wink"} size={64} />
        <View style={styles.flex}>
          <Button
            variant="honey"
            label={completed ? "Leçon terminée ✓" : "Terminer la leçon"}
            pending={pending}
            disabled={completed || !correct}
            onPress={() => void complete()}
          />
        </View>
      </View>
      <StatusText tone={status?.error ? "danger" : "muted"}>
        {status?.text}
      </StatusText>

      {completed && next ? (
        <Button
          variant="outline"
          label={`Jour ${next.day} : ${next.title}`}
          trailing="→"
          onPress={() =>
            router.replace({
              pathname: "/lesson/[slug]",
              params: { slug: next.slug },
            })
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "800" },
  options: { gap: space[2] },
  row: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1 },
});

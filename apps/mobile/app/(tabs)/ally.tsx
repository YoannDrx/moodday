import { allyLessons } from "@moodday/domain";
import { radius, space, sticker } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bouyotte } from "../../src/components/bouyotte";
import { Screen } from "../../src/components/screen";
import { TabHeaderActions } from "../../src/components/tab-header-actions";
import {
  Button,
  Card,
  StatusText,
  Sticker,
  Txt,
} from "../../src/components/ui";
import { appBaseUrl } from "../../src/lib/api";
import { authClient } from "../../src/lib/auth-client";
import { allyProgress } from "../../src/lib/couple-view";
import { usePalette } from "../../src/lib/theme";
import { refreshToday, useTodayState } from "../../src/lib/today-store";

const guides = [
  {
    path: "/posts/syndrome-premenstruel",
    title: "Le syndrome prémenstruel, en clair",
    text: "Ce que c’est, ce que ça n’est pas, et ce qui peut aider.",
  },
  {
    path: "/posts/tdpm-trouble-dysphorique-premenstruel",
    title: "TDPM : quand c’est plus que le SPM",
    text: "Les signes à connaître et comment en parler à un ou une professionnelle.",
  },
  {
    path: "/posts/aider-sa-partenaire-pendant-le-spm",
    title: "Ce que ton duo apprend dans le Programme Allié",
    text: "Le guide que ton ou ta partenaire suit, pour parler le même langage.",
  },
];

function ForMe() {
  const router = useRouter();
  const [status, setStatus] = useState<string>();
  const open = async (path: string) => {
    try {
      await WebBrowser.openBrowserAsync(`${appBaseUrl}${path}`);
    } catch {
      setStatus("La lecture ne peut pas s’ouvrir pour le moment.");
    }
  };
  return (
    <>
      {guides.map((guide) => (
        <Pressable
          key={guide.path}
          accessibilityRole="link"
          accessibilityLabel={`${guide.title}. ${guide.text}`}
          onPress={() => void open(guide.path)}
        >
          <Sticker>
            <Txt variant="heading">📖 {guide.title}</Txt>
            <Txt variant="small" tone="muted">
              {guide.text}
            </Txt>
          </Sticker>
        </Pressable>
      ))}
      <StatusText tone="danger">{status}</StatusText>
      <Card fill="plum" title="Si ton SPM est vraiment lourd">
        <Txt>
          Si chaque mois les jours d’avant les règles bousculent ton travail,
          tes relations ou ton moral, parles-en à un ou une professionnelle de
          santé. Faire ton point chaque jour pendant deux cycles donne une trace
          claire à montrer en consultation.
        </Txt>
        <Button
          variant="danger"
          label="Besoin d’aide maintenant : 3114, 24 h/24"
          onPress={() => router.push("/help")}
        />
      </Card>
    </>
  );
}

function AllyProgramme() {
  const router = useRouter();
  const palette = usePalette();
  const { today } = useTodayState();
  const supporter = today?.supporter;
  if (!supporter) return null;
  const progress = allyProgress(supporter);
  const finished = progress.done >= progress.total;

  return (
    <>
      <View style={styles.row}>
        <Bouyotte mood={finished ? "happy" : "wink"} size={80} />
        <Txt tone="muted" style={[styles.flex, styles.bold]}>
          {finished
            ? "Programme terminé. Tu fais désormais partie des gens qui savent."
            : `${progress.done}/${progress.total} leçons · 2 minutes par jour`}
        </Txt>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Progression du programme"
        accessibilityValue={{ min: 0, max: progress.total, now: progress.done }}
        style={[
          styles.progress,
          {
            borderColor: palette.border,
            backgroundColor: palette.surfaceStrong,
          },
        ]}
      >
        <View
          style={{
            width: `${(progress.done / progress.total) * 100}%`,
            height: "100%",
            backgroundColor: palette.honey,
          }}
        />
      </View>
      {allyLessons.map((lesson) => {
        const isNext = progress.nextSlug === lesson.slug;
        const done = progress.isCompleted(lesson.slug);
        return (
          <Pressable
            key={lesson.slug}
            accessibilityRole="button"
            accessibilityLabel={`Jour ${lesson.day} : ${lesson.title}${done ? ", terminée" : isNext ? ", à faire" : ""}`}
            onPress={() =>
              router.push({
                pathname: "/lesson/[slug]",
                params: { slug: lesson.slug },
              })
            }
          >
            <Sticker background={isNext ? palette.honeySoft : undefined}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.day,
                    {
                      borderColor: palette.border,
                      backgroundColor: done
                        ? palette.mint
                        : palette.surfaceStrong,
                    },
                  ]}
                >
                  <Txt variant="heading" tone={done ? "ink" : "default"}>
                    {done ? "✓" : String(lesson.day)}
                  </Txt>
                </View>
                <Txt style={[styles.flex, styles.bold]}>{lesson.title}</Txt>
                <Txt style={styles.bold}>{isNext ? "À faire →" : "→"}</Txt>
              </View>
            </Sticker>
          </Pressable>
        );
      })}
    </>
  );
}

export default function AllyScreen() {
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const { today, status } = useTodayState();
  const isSupporter = today?.role === "supporter";
  return (
    <Screen
      title={isSupporter ? "Programme Allié" : "Pour moi"}
      subtitle={
        isSupporter
          ? "Sept leçons de deux minutes pour comprendre, sans clichés."
          : "Des lectures courtes, sans injonction ni culpabilité."
      }
      leading={<TabHeaderActions />}
      refreshing={status === "loading"}
      onRefresh={ownerId ? () => void refreshToday(ownerId) : undefined}
    >
      {isSupporter ? <AllyProgramme /> : <ForMe />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[4] },
  flex: { flex: 1 },
  bold: { fontWeight: "800" },
  progress: {
    height: 18,
    overflow: "hidden",
    borderWidth: sticker.borderWidth,
    borderRadius: radius.pill,
  },
  day: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: sticker.borderWidth,
    borderRadius: radius.pill,
  },
});

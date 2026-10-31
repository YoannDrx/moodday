import { space } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Screen } from "../src/components/screen";
import { Button, StatusText, Sticker, Txt } from "../src/components/ui";
import { crisisResources } from "../src/lib/crisis";

// Sober on purpose: no mascot, no humour, no network, no account needed.

export default function HelpScreen() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  const open = async (href: string, number: string) => {
    setError(undefined);
    try {
      await Linking.openURL(href);
    } catch {
      setError(
        `Ce téléphone ne peut pas lancer l’appel. Compose directement le ${number}.`,
      );
    }
  };

  return (
    <Screen
      help={false}
      title="Besoin d’aide"
      subtitle="Si tu es en danger immédiat, appelle le 15 ou le 112."
      leading={
        <Button
          compact
          variant="outline"
          label="Fermer"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
      }
      testID="help-screen"
    >
      <Txt>
        Ces numéros sont gratuits et joignables 24 h/24, 7 j/7, partout en
        France. Tu n’as pas besoin d’être sûr·e que « c’est assez grave » pour
        appeler.
      </Txt>
      {crisisResources.map((resource) => (
        <Sticker key={resource.number} shadow={false}>
          <Txt variant="heading">{resource.title}</Txt>
          <Txt>{resource.description}</Txt>
          <View style={styles.action}>
            <Button
              variant="primary"
              label={resource.action}
              accessibilityLabel={resource.action}
              onPress={() => void open(resource.href, resource.number)}
            />
          </View>
        </Sticker>
      ))}
      <StatusText tone="danger">{error}</StatusText>
      <Txt variant="small" tone="muted">
        Moodday est un outil personnel non médical. Il ne remplace ni un
        professionnel de santé ni les services d’urgence.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({ action: { marginTop: space[1] } });

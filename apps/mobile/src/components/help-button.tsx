import { radius, space, sticker } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { usePalette } from "../lib/theme";

/** Always reachable, works offline, never behind a paywall. */
export function HelpButton() {
  const router = useRouter();
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Besoin d’aide"
      accessibilityHint="Ouvre les numéros d’urgence"
      hitSlop={8}
      onPress={() => router.push("/help")}
      testID="help-button"
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: palette.danger,
          backgroundColor: palette.dangerSoft,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: palette.danger }]}>
        Besoin d’aide
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: sticker.borderWidth,
  },
  label: { fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});

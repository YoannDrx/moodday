import { radius, space, sticker } from "@moodday/design-tokens";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { usePalette } from "../lib/theme";

export function TabHeaderActions() {
  const router = useRouter();
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Réglages"
      hitSlop={8}
      onPress={() => router.push("/settings")}
      style={({ pressed }) => [
        styles.button,
        { borderColor: palette.border, backgroundColor: palette.surfaceStrong },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: palette.ink }]}>⚙ Réglages</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: sticker.borderWidth,
  },
  label: { fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});

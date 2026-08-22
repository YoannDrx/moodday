import { color, radius } from "@moodday/design-tokens";
import { StyleSheet, Text, View } from "react-native";

export function MoodDayMark({ size = 52 }: { size?: number }) {
  const scale = size / 52;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius.medium * scale,
        },
      ]}
    >
      <View
        style={[
          styles.calendar,
          {
            width: 30 * scale,
            height: 29 * scale,
            borderRadius: 6 * scale,
            borderWidth: Math.max(2, 2.5 * scale),
          },
        ]}
      >
        <View style={[styles.divider, { top: 8 * scale, height: 2 * scale }]} />
        <View
          style={[
            styles.ring,
            styles.ringLeft,
            { width: 3 * scale, height: 8 * scale, top: -5 * scale },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.ringRight,
            { width: 3 * scale, height: 8 * scale, top: -5 * scale },
          ]}
        />
        <Text
          style={[
            styles.heart,
            { fontSize: 15 * scale, lineHeight: 18 * scale },
          ]}
        >
          ♥
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.primaryDeep,
  },
  calendar: {
    alignItems: "center",
    justifyContent: "flex-end",
    borderColor: color.canvas,
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: color.canvas,
  },
  ring: {
    position: "absolute",
    borderRadius: radius.pill,
    backgroundColor: color.canvas,
  },
  ringLeft: { left: 5 },
  ringRight: { right: 5 },
  heart: { color: "#F3A67A", fontWeight: "800" },
});

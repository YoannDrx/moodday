import { color, radius, space } from "@moodday/design-tokens";
import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

type SectionCardProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
}>;

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[3],
    padding: space[5],
    borderRadius: radius.large,
    backgroundColor: color.surfaceStrong,
    borderWidth: 1,
    borderColor: color.border,
  },
  eyebrow: {
    color: color.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: color.ink, fontSize: 22, lineHeight: 28, fontWeight: "700" },
  description: { color: color.inkMuted, fontSize: 15, lineHeight: 22 },
});

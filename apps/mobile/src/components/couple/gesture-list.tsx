import type { GestureDto } from "@moodday/contracts";
import { radius, space, sticker } from "@moodday/design-tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { api } from "../../lib/api";
import { formatGestureTime } from "../../lib/couple-view";
import { usePalette } from "../../lib/theme";
import { Button, StatusText, Txt } from "../ui";

export function GestureList({
  gestures,
  partnerName,
  canThank,
  emptyText,
  onChanged,
}: {
  gestures: readonly GestureDto[];
  partnerName: string | null;
  canThank: boolean;
  emptyText: string;
  onChanged?: () => void;
}) {
  const palette = usePalette();
  const [pendingId, setPendingId] = useState<string>();
  const [thanked, setThanked] = useState<readonly string[]>([]);
  const [status, setStatus] = useState<string>();

  if (gestures.length === 0)
    return (
      <Txt variant="small" tone="muted">
        {emptyText}
      </Txt>
    );

  const thank = async (gesture: GestureDto) => {
    setPendingId(gesture.id);
    setStatus(undefined);
    try {
      await api.thankGesture(gesture.id);
      setThanked((list) => [...list, gesture.id]);
      setStatus(`Merci envoyé à ${partnerName ?? "ton duo"}.`);
      onChanged?.();
    } catch {
      setStatus("Le merci n’est pas parti. Réessaie dans un instant.");
    } finally {
      setPendingId(undefined);
    }
  };

  return (
    <View style={styles.list}>
      {gestures.map((gesture) => {
        const isThanked =
          gesture.status === "thanked" || thanked.includes(gesture.id);
        return (
          <View
            key={gesture.id}
            style={[
              styles.item,
              {
                borderColor: palette.border,
                backgroundColor: palette.surfaceStrong,
              },
            ]}
          >
            <View style={styles.text}>
              <Txt style={styles.bold}>
                {gesture.kind === "custom"
                  ? `« ${gesture.label} »`
                  : gesture.label}
              </Txt>
              <Txt variant="small" tone="muted">
                {gesture.fromMe ? "Toi" : (partnerName ?? "Ton duo")} ·{" "}
                {formatGestureTime(gesture.createdAt)}
                {isThanked ? " · merci reçu" : ""}
              </Txt>
            </View>
            {canThank && !gesture.fromMe && !isThanked ? (
              <Button
                compact
                variant="mint"
                label="Merci"
                trailing="♥"
                accessibilityLabel={`Dire merci pour « ${gesture.label} »`}
                pending={pendingId === gesture.id}
                disabled={Boolean(pendingId)}
                onPress={() => void thank(gesture)}
              />
            ) : null}
          </View>
        );
      })}
      <StatusText>{status}</StatusText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[2] },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderWidth: sticker.borderWidth,
    borderRadius: radius.medium,
  },
  text: { flex: 1, gap: 2 },
  bold: { fontWeight: "800" },
});

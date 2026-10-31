import { MoodDayApiError } from "@moodday/api-client";
import { space } from "@moodday/design-tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { api } from "../../lib/api";
import { newOperationId } from "../../lib/offline-queue";
import { Button, Field, StatusText } from "../ui";

/** One tap sends a suggested gesture; a short custom word is also possible. */
export function GesturePanel({
  checkInId,
  suggestions,
  ownerName,
  onSent,
}: {
  checkInId: string | null;
  suggestions: readonly { key: string; label: string }[];
  ownerName: string;
  onSent?: () => void;
}) {
  const [sent, setSent] = useState<readonly string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string>();
  const [status, setStatus] = useState<{ text: string; error: boolean }>();

  const send = async (kind: string, text?: string) => {
    if (pending) return;
    setPending(kind);
    setStatus(undefined);
    try {
      await api.sendGesture({
        operationId: newOperationId(),
        checkInId,
        kind,
        message: text ?? null,
      });
      setSent((list) => [...list, kind]);
      if (kind === "custom") setMessage("");
      setStatus({ text: `Envoyé. ${ownerName} va le voir.`, error: false });
      onSent?.();
    } catch (error) {
      setStatus({
        text:
          error instanceof MoodDayApiError
            ? "Ce geste n’est pas parti. Réessaie dans un instant."
            : "Pas de réseau : ce geste n’est pas parti. Réessaie quand tu es connecté·e.",
        error: true,
      });
    } finally {
      setPending(undefined);
    }
  };

  return (
    <View style={styles.panel}>
      {suggestions.map((suggestion, index) => (
        <Button
          key={suggestion.key}
          variant={index === 0 ? "honey" : "outline"}
          label={suggestion.label}
          trailing={sent.includes(suggestion.key) ? "✓" : "→"}
          pending={pending === suggestion.key}
          disabled={Boolean(pending)}
          onPress={() => void send(suggestion.key)}
        />
      ))}
      <Field
        label="Un petit mot"
        maxLength={140}
        value={message}
        onChangeText={setMessage}
        placeholder="Ou un petit mot à toi…"
        returnKeyType="send"
        onSubmitEditing={() => {
          if (message.trim()) void send("custom", message.trim());
        }}
      />
      <Button
        variant="primary"
        label="Envoyer le mot"
        pending={pending === "custom"}
        disabled={Boolean(pending) || !message.trim()}
        onPress={() => void send("custom", message.trim())}
      />
      <StatusText tone={status?.error ? "danger" : "muted"}>
        {status?.text}
      </StatusText>
    </View>
  );
}

const styles = StyleSheet.create({ panel: { gap: space[3] } });

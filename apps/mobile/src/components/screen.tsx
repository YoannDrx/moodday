import { space } from "@moodday/design-tokens";
import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePalette } from "../lib/theme";
import { HelpButton } from "./help-button";
import { Txt } from "./ui";

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  /** Element shown at the top left, e.g. a close or back button. */
  leading?: ReactNode;
  /** The help button is on every screen except the help screen itself. */
  help?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  testID?: string;
}>;

export function Screen({
  children,
  title,
  subtitle,
  leading,
  help = true,
  refreshing,
  onRefresh,
  testID,
}: ScreenProps) {
  const palette = usePalette();
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.canvas }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          testID={testID}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={palette.ink}
              />
            ) : undefined
          }
        >
          <View style={styles.topBar}>
            <View style={styles.flex}>{leading}</View>
            {help ? <HelpButton /> : null}
          </View>
          {title ? (
            <View style={styles.header}>
              <Txt variant="display" accessibilityRole="header">
                {title}
              </Txt>
              {subtitle ? (
                <Txt tone="muted" style={styles.subtitle}>
                  {subtitle}
                </Txt>
              ) : null}
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: space[5], paddingBottom: space[12], gap: space[5] },
  topBar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[3],
  },
  header: { gap: space[1] },
  subtitle: { fontWeight: "700" },
});

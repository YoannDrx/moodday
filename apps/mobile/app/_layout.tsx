import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { color } from "@moodday/design-tokens";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="routine-new" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="appointment-new"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="appointment/[appointmentId]" />
      </Stack>
    </>
  );
}

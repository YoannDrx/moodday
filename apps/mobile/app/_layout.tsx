import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { color } from "@moodday/design-tokens";
import { useEffect } from "react";
import { addNotificationNavigationListener } from "../src/lib/notifications";
import { AccountAccessGate } from "../src/components/account-access-gate";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const subscription = addNotificationNavigationListener((route) => {
      router.push(route);
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        // Guard the screen component itself, not only its rendered content:
        // a deep-linked modal must not start health effects before consent.
        // Tabs keep their own gate inside the owner/session locking boundary.
        screenLayout={({ children, route }) =>
          route.name === "(tabs)" ? (
            children
          ) : (
            <AccountAccessGate>{children}</AccountAccessGate>
          )
        }
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="two-factor" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="health-connections"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="calendar-connections"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="native-calendar-import"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="safety-plan" options={{ presentation: "modal" }} />
        <Stack.Screen name="routine-new" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="appointment-new"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="appointment/[appointmentId]" />
        <Stack.Screen
          name="medication-new"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="medication/[medicationId]" />
        <Stack.Screen
          name="medication/[medicationId]/edit"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </>
  );
}

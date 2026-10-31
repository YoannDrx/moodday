import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AccountAccessGate } from "../src/components/account-access-gate";
import { addNotificationNavigationListener } from "../src/lib/notifications";
import { usePalette } from "../src/lib/theme";

// Screens reachable without an account: authentication and the help screen,
// which must open offline, signed out and before any consent.
const ungatedRoutes = new Set([
  "(tabs)",
  "help",
  "sign-in",
  "two-factor",
  "forgot-password",
]);

export default function RootLayout() {
  const router = useRouter();
  const palette = usePalette();

  useEffect(() => {
    const subscription = addNotificationNavigationListener((route) => {
      router.navigate(route);
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        // Guard the screen component itself, not only its rendered content:
        // a deep-linked screen must not load duo data before consent. Tabs
        // keep their own gate inside the session boundary.
        screenLayout={({ children, route }) =>
          ungatedRoutes.has(route.name) ? (
            children
          ) : (
            <AccountAccessGate>{children}</AccountAccessGate>
          )
        }
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="two-factor" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="lesson/[slug]" />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="help" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

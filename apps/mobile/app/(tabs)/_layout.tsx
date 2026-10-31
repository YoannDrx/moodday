import { getCommonMessages } from "@moodday/i18n";
import * as Network from "expo-network";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";
import { AccountAccessGate } from "../../src/components/account-access-gate";
import { authClient } from "../../src/lib/auth-client";
import { needsOnboarding, tabsForRole } from "../../src/lib/navigation";
import {
  addNotificationReceivedListener,
  ensurePushRegistration,
} from "../../src/lib/notifications";
import { configureMobilePurchases } from "../../src/lib/purchases";
import {
  isMobileSessionInvalidated,
  subscribeToMobileSessionInvalidation,
} from "../../src/lib/session-security";
import { usePalette } from "../../src/lib/theme";
import {
  refreshToday,
  resetToday,
  syncOfflineAndRefresh,
  useTodayState,
} from "../../src/lib/today-store";

const messages = getCommonMessages("fr");

function Loading() {
  const palette = usePalette();
  return (
    <View
      accessibilityLabel={messages.sessionLoading}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.canvas,
      }}
    >
      <ActivityIndicator color={palette.ink} />
    </View>
  );
}

const TabGlyph = ({ glyph, color }: { glyph: string; color: string }) => (
  <Text
    accessibilityElementsHidden
    importantForAccessibility="no"
    style={{ color, fontSize: 20, fontWeight: "800" }}
  >
    {glyph}
  </Text>
);

function CoupleTabs({ ownerId }: { ownerId: string }) {
  const palette = usePalette();
  const { today, status, rememberedRole } = useTodayState();

  useEffect(() => {
    void syncOfflineAndRefresh(ownerId);
    // Refresh an already granted push token; never prompt at launch.
    void ensurePushRegistration({ prompt: false }).catch(() => undefined);

    const network = Network.addNetworkStateListener((event) => {
      if (event.isConnected && event.isInternetReachable !== false)
        void syncOfflineAndRefresh(ownerId);
    });
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") void syncOfflineAndRefresh(ownerId);
    });
    const received = addNotificationReceivedListener(() => {
      void refreshToday(ownerId);
    });
    return () => {
      network.remove();
      appState.remove();
      received.remove();
    };
  }, [ownerId]);

  if (!today && (status === "idle" || status === "loading")) return <Loading />;
  if (today && needsOnboarding(today)) return <Redirect href="/onboarding" />;

  const tabs = tabsForRole(today?.role ?? rememberedRole ?? null);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.inkMuted,
        tabBarActiveBackgroundColor: palette.honeySoft,
        tabBarStyle: {
          minHeight: 76,
          paddingTop: 6,
          paddingBottom: 10,
          backgroundColor: palette.surfaceStrong,
          borderTopColor: palette.border,
          borderTopWidth: 2,
        },
        tabBarItemStyle: { borderRadius: 18, marginHorizontal: 4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "800" },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => (
              <TabGlyph glyph={tab.glyph} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

export default function TabLayout() {
  const { data: session, isPending } = authClient.useSession();
  const ownerId = session?.user.id;
  const [sessionInvalidated, setSessionInvalidated] = useState(
    isMobileSessionInvalidated,
  );

  useEffect(
    () =>
      subscribeToMobileSessionInvalidation(() => {
        setSessionInvalidated(true);
        resetToday();
        void authClient.signOut();
      }),
    [],
  );

  useEffect(() => {
    if (!ownerId || sessionInvalidated) return;
    void configureMobilePurchases(ownerId).catch(() => {
      // The server remains authoritative and the settings expose a retry.
    });
  }, [ownerId, sessionInvalidated]);

  if (isPending && !sessionInvalidated) return <Loading />;
  if (!ownerId || sessionInvalidated) return <Redirect href="/sign-in" />;

  return (
    <AccountAccessGate>
      <CoupleTabs ownerId={ownerId} />
    </AccountAccessGate>
  );
}

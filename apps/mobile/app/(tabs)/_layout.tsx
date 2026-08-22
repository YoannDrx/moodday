import { Redirect, Tabs } from "expo-router";
import { color } from "@moodday/design-tokens";
import { getCommonMessages } from "@moodday/i18n";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { authClient } from "../../src/lib/auth-client";
import { closeOwnerLocalDatabase } from "../../src/lib/local-database";
import { getSessionOwnerTransition } from "../../src/lib/local-database-core";
import {
  isMobileSessionInvalidated,
  subscribeToMobileSessionInvalidation,
} from "../../src/lib/session-security";

const messages = getCommonMessages("fr");

const TabGlyph = ({ glyph, focused }: { glyph: string; focused: boolean }) => (
  <Text
    accessibilityElementsHidden
    style={{ color: focused ? color.primary : color.inkMuted, fontSize: 20 }}
  >
    {glyph}
  </Text>
);

export default function TabLayout() {
  const { data: session, isPending } = authClient.useSession();
  const ownerId = session?.user.id;
  const [sessionInvalidated, setSessionInvalidated] = useState(
    isMobileSessionInvalidated,
  );
  const activeOwnerId = useRef<string | undefined>(undefined);
  const [lockState, setLockState] = useState<"idle" | "locking" | "failed">(
    "idle",
  );
  const [lockAttempt, setLockAttempt] = useState(0);
  const transition = getSessionOwnerTransition({
    currentOwnerId: sessionInvalidated ? undefined : ownerId,
    isPending: isPending && !sessionInvalidated,
    previousOwnerId: activeOwnerId.current,
  });

  useEffect(
    () =>
      subscribeToMobileSessionInvalidation(() => {
        setSessionInvalidated(true);
        void authClient.signOut();
      }),
    [],
  );

  // Adopt the authenticated owner before child passive effects can open a
  // database, so even an immediate 401 has an owner connection to lock.
  useLayoutEffect(() => {
    if (transition === "adopt") activeOwnerId.current = ownerId;
  }, [ownerId, transition]);

  useEffect(() => {
    if (transition === "adopt") return;
    if (transition !== "lock" || !activeOwnerId.current) return;

    const previousOwnerId = activeOwnerId.current;
    let current = true;
    setLockState("locking");
    closeOwnerLocalDatabase(previousOwnerId)
      .then(() => {
        if (!current) return;
        activeOwnerId.current = sessionInvalidated ? undefined : ownerId;
        setLockState("idle");
      })
      .catch(() => {
        if (current) setLockState("failed");
      });
    return () => {
      current = false;
    };
  }, [lockAttempt, ownerId, sessionInvalidated, transition]);

  if (isPending || transition === "lock" || lockState !== "idle") {
    return (
      <View
        accessibilityLabel={
          lockState === "failed"
            ? "Le verrouillage local a échoué"
            : messages.sessionLoading
        }
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color.canvas,
          gap: 16,
          padding: 24,
        }}
      >
        {lockState === "failed" ? (
          <>
            <Text
              accessibilityLiveRegion="assertive"
              style={{ color: color.danger, textAlign: "center" }}
            >
              Impossible de verrouiller les données de cet appareil.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLockState("idle");
                setLockAttempt((attempt) => attempt + 1);
              }}
              style={{
                minHeight: 48,
                justifyContent: "center",
                borderRadius: 18,
                backgroundColor: color.primary,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ color: color.surfaceStrong, fontWeight: "700" }}>
                Réessayer
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={color.primary} />
        )}
      </View>
    );
  }

  if (!session || sessionInvalidated) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.inkMuted,
        tabBarStyle: {
          minHeight: 76,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: color.surfaceStrong,
          borderTopColor: color.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: messages.navigation.today,
          tabBarIcon: ({ focused }) => <TabGlyph glyph="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reperes"
        options={{
          title: messages.navigation.landmarks,
          tabBarIcon: ({ focused }) => <TabGlyph glyph="⌁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="soin"
        options={{
          title: messages.navigation.care,
          tabBarIcon: ({ focused }) => (
            <TabGlyph glyph="＋" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cercle"
        options={{
          title: messages.navigation.circle,
          tabBarIcon: ({ focused }) => <TabGlyph glyph="○" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

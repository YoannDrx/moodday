import { Redirect, Tabs } from "expo-router";
import { color } from "@moodday/design-tokens";
import { getCommonMessages } from "@moodday/i18n";
import { ActivityIndicator, Text, View } from "react-native";
import { authClient } from "../../src/lib/auth-client";

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

  if (isPending) {
    return (
      <View
        accessibilityLabel={messages.sessionLoading}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color.canvas,
        }}
      >
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/sign-in" />;

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

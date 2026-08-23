import type { MedicationDto } from "@moodday/contracts";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import {
  defaultLocalReminderPreferences,
  planLocalNotifications,
  type LocalReminderPreferences,
} from "./notification-planner";

const preferencesKey = "moodday.local-reminder-preferences.v1";
const identifierPrefix = "moodday-reminder-";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const getLocalReminderPreferences = async () => {
  const stored = await SecureStore.getItemAsync(preferencesKey);
  if (!stored) return defaultLocalReminderPreferences;
  try {
    const value = JSON.parse(stored) as Partial<LocalReminderPreferences>;
    return { ...defaultLocalReminderPreferences, ...value };
  } catch {
    return defaultLocalReminderPreferences;
  }
};

const hasNotificationPermission = (
  status: Notifications.NotificationPermissionsStatus,
) =>
  status.granted ||
  status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
  status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;

export const getLocalNotificationPermission = async () =>
  hasNotificationPermission(await Notifications.getPermissionsAsync());

const cancelMoodDayNotifications = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) =>
        notification.identifier.startsWith(identifierPrefix),
      )
      .map(async (notification) => {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        );
      }),
  );
};

export const updateLocalNotificationSchedule = async ({
  medications,
  preferences,
  requestPermission = false,
}: {
  medications: MedicationDto[];
  preferences: LocalReminderPreferences;
  requestPermission?: boolean;
}) => {
  let permission = await Notifications.getPermissionsAsync();
  if (
    preferences.enabled &&
    requestPermission &&
    !hasNotificationPermission(permission)
  ) {
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
  }
  const permitted = hasNotificationPermission(permission);
  const persisted = {
    ...preferences,
    enabled: preferences.enabled && permitted,
  };
  await SecureStore.setItemAsync(preferencesKey, JSON.stringify(persisted));
  await cancelMoodDayNotifications();
  if (!persisted.enabled) return { permitted, scheduled: 0 };

  const plan = planLocalNotifications({
    medications,
    now: new Date(),
    preferences: persisted,
  });
  await Promise.all(
    plan.map(async (item) => {
      await Notifications.scheduleNotificationAsync({
        identifier: item.identifier,
        content: {
          title: "Mood Day",
          body:
            item.kind === "daily_check_in"
              ? "Un repère doux t’attend dans Mood Day."
              : "Un rappel de traitement t’attend dans Mood Day.",
          data: { route: item.route },
        },
        trigger: item.date
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: item.date,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: item.hour,
              minute: item.minute,
            },
      });
    }),
  );
  return { permitted, scheduled: plan.length };
};

export const addNotificationNavigationListener = (
  navigate: (route: "/(tabs)/today" | "/(tabs)/soin") => void,
) =>
  Notifications.addNotificationResponseReceivedListener((response) => {
    const route = response.notification.request.content.data?.route;
    if (route === "/(tabs)/today" || route === "/(tabs)/soin") {
      navigate(route);
    }
  });

import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api } from "./api";
import { routeForNotificationUrl, type NotificationRoute } from "./navigation";
import { ownerStorageKey } from "./offline-queue";

// Remote push only: partner check-ins, gestures and "merci". The permission
// is requested after the duo is formed or from the settings, never at launch.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const devicePublicIdKey = "moodday.device-public-id";

export const getDevicePublicId = async () => {
  const existing = await SecureStore.getItemAsync(devicePublicIdKey);
  if (existing && existing.length >= 8) return existing;
  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(devicePublicIdKey, created, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return created;
};

export type PushPermission = "granted" | "denied" | "undetermined";

const toPermission = (
  status: Notifications.NotificationPermissionsStatus,
): PushPermission => {
  if (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  )
    return "granted";
  return status.canAskAgain ? "undetermined" : "denied";
};

export const getPushPermission = async () =>
  toPermission(await Notifications.getPermissionsAsync());

const projectId = () => {
  const fromExtra = (
    Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined
  )?.eas?.projectId;
  const value =
    typeof fromExtra === "string" ? fromExtra : Constants.easConfig?.projectId;
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const platform = () => (Platform.OS === "ios" ? "ios" : "android");

/**
 * Registers this device for partner notifications. With `prompt`, asks the
 * system permission first; without it, only refreshes an already granted
 * token so a launch never shows a permission dialog.
 */
const optOutKey = "moodday.push-opt-out";

/** Set from the settings: launches then stop re-registering the token. */
export const isPushOptedOut = async () =>
  (await SecureStore.getItemAsync(optOutKey)) === "1";

export const ensurePushRegistration = async ({
  prompt,
}: {
  prompt: boolean;
}): Promise<PushPermission> => {
  if (prompt) await SecureStore.deleteItemAsync(optOutKey);
  else if (await isPushOptedOut()) return "denied";
  let permission = await getPushPermission();
  if (permission === "undetermined" && prompt) {
    permission = toPermission(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      }),
    );
  }
  if (permission !== "granted") return permission;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Moodday",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const id = projectId();
  const token = await Notifications.getExpoPushTokenAsync(
    id ? { projectId: id } : undefined,
  );
  await api.registerDevice({
    publicId: await getDevicePublicId(),
    platform: platform(),
    displayName: null,
    pushToken: token.data,
  });
  return permission;
};

/**
 * Stops partner notifications on this device. `optOut` (settings) also keeps
 * later launches from registering again; sign-out leaves the choice intact.
 */
export const unregisterPush = async ({ optOut = false } = {}) => {
  await api.registerDevice({
    publicId: await getDevicePublicId(),
    platform: platform(),
    displayName: null,
    pushToken: null,
  });
  if (optOut) await SecureStore.setItemAsync(optOutKey, "1");
};

const dismissedKey = async (ownerId: string) =>
  ownerStorageKey("moodday.push-invite-dismissed", ownerId);

export const isPushInviteDismissed = async (ownerId: string) =>
  (await SecureStore.getItemAsync(await dismissedKey(ownerId))) === "1";

export const dismissPushInvite = async (ownerId: string) =>
  SecureStore.setItemAsync(await dismissedKey(ownerId), "1");

const routeFromResponse = (response: Notifications.NotificationResponse) =>
  routeForNotificationUrl(response.notification.request.content.data?.url);

export const addNotificationNavigationListener = (
  navigate: (route: NotificationRoute) => void,
) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => navigate(routeFromResponse(response)),
  );
  // A tap that cold-started the app is delivered before the listener exists.
  void Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        navigate(routeFromResponse(response));
        Notifications.clearLastNotificationResponse();
      }
    })
    .catch(() => undefined);
  return subscription;
};

export const addNotificationReceivedListener = (listener: () => void) =>
  Notifications.addNotificationReceivedListener(() => listener());

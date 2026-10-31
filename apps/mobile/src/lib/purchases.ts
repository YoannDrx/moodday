import type { EntitlementDto } from "@moodday/contracts";
import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { api } from "./api";

// The "Duo" subscription, sold through RevenueCat behind a build flag. One
// subscription covers both members of the couple; the server stays the
// authority on the entitlement.

const extra = Constants.expoConfig?.extra;
const enabled = extra?.revenueCatEnabled === true;
const apiKey =
  Platform.OS === "ios"
    ? extra?.revenueCatIosApiKey
    : Platform.OS === "android"
      ? extra?.revenueCatAndroidApiKey
      : undefined;

let configuredUserId: string | undefined;

export const isMobileBillingAvailable = () =>
  enabled && typeof apiKey === "string" && apiKey.length > 0;

export async function configureMobilePurchases(userId: string) {
  if (!isMobileBillingAvailable()) return false;
  if (configuredUserId === userId) return true;
  if (!configuredUserId) {
    Purchases.configure({
      apiKey,
      appUserID: userId,
      automaticDeviceIdentifierCollectionEnabled: false,
    });
  } else {
    await Purchases.logIn(userId);
  }
  configuredUserId = userId;
  return true;
}

/** Asks the server to re-read RevenueCat after a purchase or a restore. */
const refreshServerEntitlement = async (): Promise<EntitlementDto> =>
  api.refreshMobileEntitlements();

export async function presentDuoPaywall(userId: string) {
  if (!(await configureMobilePurchases(userId))) {
    throw new Error("mobile_billing_unavailable");
  }
  await RevenueCatUI.presentPaywall({ displayCloseButton: true });
  return refreshServerEntitlement();
}

export async function restoreDuoPurchases(userId: string) {
  if (!(await configureMobilePurchases(userId))) {
    throw new Error("mobile_billing_unavailable");
  }
  await Purchases.restorePurchases();
  return refreshServerEntitlement();
}

export async function showMobileSubscriptionManagement(userId: string) {
  if (!(await configureMobilePurchases(userId))) {
    throw new Error("mobile_billing_unavailable");
  }
  await Purchases.showManageSubscriptions();
  return undefined;
}

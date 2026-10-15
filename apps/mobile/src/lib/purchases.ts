import type { EntitlementDto } from "@moodday/contracts";
import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { api } from "./api";

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

async function refreshServerEntitlement(): Promise<EntitlementDto> {
  return api.refreshMobileEntitlements();
}

export async function presentPlusPaywall(userId: string) {
  if (!(await configureMobilePurchases(userId))) {
    throw new Error("mobile_billing_unavailable");
  }
  await RevenueCatUI.presentPaywall({ displayCloseButton: true });
  return refreshServerEntitlement();
}

export async function restorePlusPurchases(userId: string) {
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

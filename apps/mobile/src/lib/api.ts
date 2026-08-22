import { createApiClient } from "@moodday/api-client";
import Constants from "expo-constants";
import { authClient } from "./auth-client";

const apiUrl = Constants.expoConfig?.extra?.apiUrl;

if (typeof apiUrl !== "string") {
  throw new Error("Mood Day mobile API configuration is incomplete");
}

export const appBaseUrl = apiUrl.replace(/\/$/, "");

export const api = createApiClient({
  baseUrl: appBaseUrl,
  getHeaders: async () => ({ Cookie: await authClient.getCookie() }),
});

import { expoClient } from "@better-auth/expo/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { createAuthClient } from "better-auth/react";

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
const scheme = Constants.expoConfig?.scheme;

if (typeof apiUrl !== "string" || typeof scheme !== "string") {
  throw new Error("Mood Day mobile auth configuration is incomplete");
}

// Better Auth 1.6.27 and its Expo package expose the same runtime plugin but
// resolve incompatible BetterFetch generics in a pnpm workspace. Keep the cast
// at this single boundary until the auth stack is upgraded as one reviewed unit.
const client = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    expoClient({
      scheme,
      storagePrefix: "moodday",
      cookiePrefix: "moodday",
      storage: SecureStore,
    }) as never,
  ],
});

export const authClient = client as typeof client & {
  getCookie: () => string;
};

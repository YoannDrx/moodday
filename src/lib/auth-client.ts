import {
  adminClient,
  magicLinkClient,
  twoFactorClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { getServerUrl } from "./server-url";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: getServerUrl(),
  plugins: [
    magicLinkClient(),
    adminClient(),
    twoFactorClient({ twoFactorPage: "/auth/two-factor" }),
    passkeyClient(),
    inferAdditionalFields<typeof auth>(),
    // stripeClient({ subscription: true }),
  ],
});

export type AuthClientType = typeof authClient;

export const { useSession, signOut } = authClient;

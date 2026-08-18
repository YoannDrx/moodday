import { PrismaClient } from "@prisma/client";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, magicLink, twoFactor } from "better-auth/plugins";

const schemaClient = new PrismaClient();

/**
 * Dependency-minimal mirror used only by the Better Auth schema generator.
 * Keep its plugins and additional user fields aligned with src/lib/auth.ts.
 */
export const auth = betterAuth({
  appName: "Moodday",
  database: prismaAdapter(schemaClient, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  user: {
    additionalFields: {
      age18Accepted: { type: "boolean", required: false, input: true },
      termsVersionAccepted: { type: "string", required: false, input: true },
      privacyVersionAccepted: { type: "string", required: false, input: true },
      healthDataConsentVersionAccepted: {
        type: "string",
        required: false,
        input: true,
      },
      signupLocale: { type: "string", required: false, input: true },
      launchCountry: { type: "string", required: false, input: true },
    },
  },
  plugins: [
    magicLink({ sendMagicLink: async () => undefined }),
    admin(),
    twoFactor({ issuer: "Moodday", allowPasswordless: true }),
    passkey({
      rpID: "localhost",
      rpName: "Moodday",
      origin: "http://localhost:3000",
    }),
  ],
});

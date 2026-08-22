import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { expo } from "@better-auth/expo";

import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import AccountDeletedEmail from "@email/auth/account-deleted";
import EmailChangedEmail from "@email/auth/email-changed";
import MagicLinkEmail from "@email/auth/magic-link";
import ResetPasswordEmail from "@email/auth/reset-password";
import VerifyEmail from "@email/auth/verify-email";
import { setupResendCustomer } from "./auth/auth-config-setup";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./prisma";
import {
  getPasskeyOrigin,
  getServerUrl,
  getTrustedAuthOrigins,
} from "./server-url";
import { deleteUserDataOutsideAuthCascade } from "./user/delete-user-data";
import { notifySignificantNewSession } from "./auth/new-session-alert";
import {
  getOperationalErrorCode,
  getOperationalSubjectReference,
} from "./operations/log-identifiers";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

const isolatedE2ERateLimit =
  process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED === "true" ? 1000 : null;

export const SocialProviders: SocialProvidersType = {};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  SocialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    disableSignUp: env.PUBLIC_SIGNUP_MODE !== "public",
  };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  SocialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    disableSignUp: env.PUBLIC_SIGNUP_MODE !== "public",
  };
}

export const auth = betterAuth({
  appName: SiteConfig.title,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: isolatedE2ERateLimit ?? 60,
    customRules: {
      "/sign-in/email": { window: 60, max: isolatedE2ERateLimit ?? 5 },
      "/sign-up/email": { window: 300, max: isolatedE2ERateLimit ?? 5 },
      "/request-password-reset": {
        window: 300,
        max: isolatedE2ERateLimit ?? 3,
      },
      "/change-password": { window: 300, max: isolatedE2ERateLimit ?? 5 },
      "/magic-link/send": { window: 300, max: isolatedE2ERateLimit ?? 3 },
    },
  },
  baseURL: getServerUrl(),
  trustedOrigins: getTrustedAuthOrigins(),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (NFR-S5)
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    freshAge: 60 * 10, // Reauthenticate after 10 minutes for sensitive routes
    cookieCache: {
      // Immediate device/session revocation takes precedence over the latency
      // benefit of a signed session cache for this health-data product.
      enabled: false,
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          try {
            await notifySignificantNewSession({
              id: session.id,
              userId: session.userId,
              userAgent: session.userAgent,
              ipAddress: session.ipAddress,
              createdAt: session.createdAt,
            });
          } catch (error) {
            logger.error("New session alert delivery failed", {
              eventName: "new_session_alert_failed",
              status: "failed",
              errorCode: getOperationalErrorCode(error),
              subjectReference: getOperationalSubjectReference(session.userId),
            });
          }
        },
      },
    },
    user: {
      create: {
        after: async (user, _req) => {
          try {
            await setupResendCustomer(user);
          } catch {
            logger.error("Failed to create Resend contact", {
              errorCode: "resend_contact_failed",
            });
          }

          const consentInput = user as typeof user & {
            age18Accepted?: boolean | null;
            termsVersionAccepted?: string | null;
            privacyVersionAccepted?: string | null;
            healthDataConsentVersionAccepted?: string | null;
            signupLocale?: string | null;
            launchCountry?: string | null;
          };
          if (
            consentInput.age18Accepted === true &&
            consentInput.termsVersionAccepted === env.LEGAL_TERMS_VERSION &&
            consentInput.privacyVersionAccepted === env.LEGAL_PRIVACY_VERSION &&
            consentInput.healthDataConsentVersionAccepted ===
              env.HEALTH_DATA_CONSENT_VERSION &&
            consentInput.launchCountry === env.LAUNCH_COUNTRY
          ) {
            await prisma.userConsent.createMany({
              data: [
                {
                  userId: user.id,
                  purpose: "age_18",
                  version: String(env.MINIMUM_AGE),
                  locale: consentInput.signupLocale === "en" ? "en" : "fr",
                  country: env.LAUNCH_COUNTRY,
                  source: "signup",
                },
                {
                  userId: user.id,
                  purpose: "terms",
                  version: env.LEGAL_TERMS_VERSION,
                  locale: consentInput.signupLocale === "en" ? "en" : "fr",
                  country: env.LAUNCH_COUNTRY,
                  source: "signup",
                },
                {
                  userId: user.id,
                  purpose: "privacy",
                  version: env.LEGAL_PRIVACY_VERSION,
                  locale: consentInput.signupLocale === "en" ? "en" : "fr",
                  country: env.LAUNCH_COUNTRY,
                  source: "signup",
                },
                {
                  userId: user.id,
                  purpose: "health_data",
                  version: env.HEALTH_DATA_CONSENT_VERSION,
                  locale: consentInput.signupLocale === "en" ? "en" : "fr",
                  country: env.LAUNCH_COUNTRY,
                  source: "signup",
                },
              ],
              skipDuplicates: true,
            });
          }
        },
      },
    },
  },
  advanced: {
    cookiePrefix: SiteConfig.appId,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: `Réinitialisez votre mot de passe ${SiteConfig.title} / Reset your password`,
        html: ResetPasswordEmail({
          userName: user.name,
          resetUrl: url,
        }),
        tracking: {
          template: "reset-password",
          userId: user.id,
        },
      });
    },
  },
  user: {
    additionalFields: {
      age18Accepted: {
        type: "boolean",
        required: false,
        input: true,
        returned: false,
      },
      termsVersionAccepted: {
        type: "string",
        required: false,
        input: true,
        returned: false,
      },
      privacyVersionAccepted: {
        type: "string",
        required: false,
        input: true,
        returned: false,
      },
      healthDataConsentVersionAccepted: {
        type: "string",
        required: false,
        input: true,
        returned: false,
      },
      signupLocale: {
        type: "string",
        required: false,
        input: true,
        returned: false,
      },
      launchCountry: {
        type: "string",
        required: false,
        input: true,
        returned: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({
        newEmail,
        url,
        user,
      }: {
        newEmail: string;
        url: string;
        user: { id: string; name?: string | null };
      }) => {
        await sendEmail({
          to: newEmail,
          subject: `Confirmez votre nouvelle adresse email / Confirm your new email address`,
          html: EmailChangedEmail({
            userName: user.name ?? "Utilisateur",
            verificationUrl: url,
          }),
          tracking: {
            template: "email-changed",
            userId: user.id,
          },
        });
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteUserDataOutsideAuthCascade(user);
      },
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackUrl=/auth/goodbye`;
        await sendEmail({
          to: user.email,
          subject: `Suppression de votre compte ${SiteConfig.title} / Delete your account`,
          html: AccountDeletedEmail({
            userName: user.name || "Utilisateur",
            confirmUrl: url,
          }),
          tracking: {
            template: "account-deleted",
            userId: user.id,
          },
        });
      },
    },
  },
  emailVerification: {
    expiresIn: 60 * 60,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Vérifiez votre email ${SiteConfig.title} / Verify your email`,
        html: VerifyEmail({
          userName: user.name || "Utilisateur",
          verificationUrl: url,
        }),
        tracking: {
          template: "verify-email",
          userId: user.id,
        },
      });
    },
  },
  socialProviders: SocialProviders,
  plugins: [
    expo(),
    magicLink({
      expiresIn: 10 * 60,
      storeToken: "hashed",
      disableSignUp: env.PUBLIC_SIGNUP_MODE !== "public",
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: `Votre lien de connexion ${SiteConfig.title} / Your login link`,
          html: MagicLinkEmail({
            magicLinkUrl: url,
          }),
          tracking: {
            template: "magic-link",
          },
        });
      },
    }),
    admin({}),
    twoFactor({
      issuer: SiteConfig.title,
      allowPasswordless: true,
    }),
    passkey({
      rpID: new URL(getPasskeyOrigin()).hostname,
      rpName: SiteConfig.title,
      origin: getPasskeyOrigin(),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
    }),
    // Warning: always last plugin
    nextCookies(),
  ],
});

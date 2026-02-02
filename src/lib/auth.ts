import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink } from "better-auth/plugins";

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
import { getServerUrl } from "./server-url";
import { getStripe } from "./stripe";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

export const SocialProviders: SocialProvidersType = {};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  SocialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  SocialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (NFR-S5)
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, _req) => {
          await setupResendCustomer(user);

          // Create Stripe customer for the user
          try {
            const stripeCustomer = await getStripe().customers.create({
              email: user.email,
              name: user.name,
              metadata: {
                userId: user.id,
              },
            });

            // Update user with Stripe customer ID
            await prisma.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: stripeCustomer.id },
            });
          } catch (err) {
            logger.error("Failed to create Stripe customer", { err });
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
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: `Réinitialisez votre mot de passe ${SiteConfig.title} / Reset your password`,
        html: ResetPasswordEmail({
          userName: user.name || "Utilisateur",
          resetUrl: url,
        }),
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url, user }) => {
        await sendEmail({
          to: newEmail,
          subject: `Confirmez votre nouvelle adresse email / Confirm your new email address`,
          html: EmailChangedEmail({
            userName: user.name || "Utilisateur",
            verificationUrl: url,
          }),
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackUrl=/auth/goodbye`;
        await sendEmail({
          to: user.email,
          subject: `Suppression de votre compte ${SiteConfig.title} / Delete your account`,
          html: AccountDeletedEmail({
            userName: user.name || "Utilisateur",
            confirmUrl: url,
          }),
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Vérifiez votre email ${SiteConfig.title} / Verify your email`,
        html: VerifyEmail({
          userName: user.name || "Utilisateur",
          verificationUrl: url,
        }),
      });
    },
  },
  socialProviders: SocialProviders,
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: `Votre lien de connexion ${SiteConfig.title} / Your login link`,
          html: MagicLinkEmail({
            magicLinkUrl: url,
          }),
        });
      },
    }),
    admin({}),
    // Warning: always last plugin
    nextCookies(),
  ],
});

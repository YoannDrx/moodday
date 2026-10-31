import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * This is the schema for the environment variables.
 *
 * Please import **this** file and use the `env` variable
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
    OAUTH_GOOGLE_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    OAUTH_APPLE_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    OAUTH_GITHUB_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_TEAM_ID: z.string().optional(),
    APPLE_KEY_ID: z.string().optional(),
    APPLE_PRIVATE_KEY: z.string().optional(),
    APPLE_APP_BUNDLE_IDENTIFIER: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_AUDIENCE_ID: z.string().optional(),
    RESEND_WEBHOOK_SECRET: z.string().min(16).optional(),
    EMAIL_FROM: z.string().optional().default("Moodday <moodday@yodev.fr>"),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_ACCOUNT_ID: z.string().optional(),
    STRIPE_PLUS_MONTHLY_PRICE_ID: z.string().optional(),
    STRIPE_PLUS_YEARLY_PRICE_ID: z.string().optional(),
    STRIPE_PORTAL_CONFIGURATION_ID: z.string().optional(),
    BILLING_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    PUSH_NOTIFICATIONS_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    ADMIN_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    MAINTENANCE_MODE: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    PUBLIC_SIGNUP_MODE: z
      .enum(["closed", "invite", "public"])
      .default("closed"),
    PUBLIC_SIGNUP_INVITE_EMAILS: z.string().optional(),
    STRIPE_TAX_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    STRIPE_PRODUCT_TAX_CODE: z
      .string()
      .regex(/^txcd_\d+$/)
      .optional(),
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
    CRON_SECRET: z.string().min(16).optional(),
    OPERATIONAL_ALERT_EMAIL: z.string().email().optional(),
    LEGAL_TERMS_VERSION: z.string().min(1).default("terms-2026-11"),
    LEGAL_PRIVACY_VERSION: z.string().min(1).default("privacy-2026-11"),
    HEALTH_DATA_CONSENT_VERSION: z
      .string()
      .min(1)
      .default("health-data-2026-11"),
    LAUNCH_COUNTRY: z.literal("FR").default("FR"),
    MINIMUM_AGE: z.coerce.number().int().min(18).max(18).default(18),
    NODE_ENV: z.enum(["development", "production", "test"]),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    REVENUECAT_SECRET_API_KEY: z.string().min(16).optional(),
    REVENUECAT_WEBHOOK_AUTH_TOKEN: z.string().min(32).optional(),
    REVENUECAT_WEBHOOK_SIGNING_SECRET: z.string().min(32).optional(),
    REVENUECAT_ENTITLEMENT_ID: z.string().min(1).default("plus"),
    REVENUECAT_PLUS_PRODUCT_IDS: z.string().optional(),
    REVENUECAT_ALLOWED_APP_IDS: z.string().optional(),
    REVENUECAT_WEBHOOK_ENVIRONMENTS: z.string().default("PRODUCTION"),
  },
  /**
   * If you add `client` environment variables, you need to add them to
   * `experimental__runtimeEnv` as well.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
    NEXT_PUBLIC_EMAIL_CONTACT: z
      .string()
      .optional()
      .default("hello@moodday.app"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
  },
});

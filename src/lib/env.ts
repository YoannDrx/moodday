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
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
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
    CAREGIVER_SHARING_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    PUSH_NOTIFICATIONS_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    ACCOUNT_IMPORT_ENABLED: z
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
    STRIPE_TAX_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    STRIPE_PRODUCT_TAX_CODE: z
      .string()
      .regex(/^txcd_\d+$/)
      .optional(),
    OPENAI_API_KEY: z.string().optional(),
    AI_INSIGHTS_MODEL: z.string().optional(),
    AI_INSIGHTS_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((value) => value === "true"),
    AI_ROLLOUT_MODE: z.enum(["internal", "public"]).default("internal"),
    AI_INTERNAL_USER_IDS: z.string().optional(),
    AI_SAFETY_HMAC_SECRET: z.string().min(32).optional(),
    AI_CONSENT_VERSION: z.string().min(1).default("ai-insights-2026-08"),
    AI_MONTHLY_REQUEST_BUDGET: z.coerce.number().int().positive().default(1000),
    AI_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(5),
    AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
    CRON_SECRET: z.string().min(16).optional(),
    OPERATIONAL_ALERT_EMAIL: z.string().email().optional(),
    LEGAL_TERMS_VERSION: z.string().min(1).default("terms-2026-08"),
    LEGAL_PRIVACY_VERSION: z.string().min(1).default("privacy-2026-08"),
    HEALTH_DATA_CONSENT_VERSION: z
      .string()
      .min(1)
      .default("health-data-2026-08"),
    LAUNCH_COUNTRY: z.literal("FR").default("FR"),
    MINIMUM_AGE: z.coerce.number().int().min(18).max(18).default(18),
    NODE_ENV: z.enum(["development", "production", "test"]),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
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

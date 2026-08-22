#!/usr/bin/env tsx
/* eslint-disable no-console */

import { execFileSync } from "node:child_process";

type TargetEnvironment = "production" | "preview";

const CONFIRMATION = "--confirm-safe-defaults";
if (!process.argv.includes(CONFIRMATION)) {
  throw new Error(
    `Refusing to update Vercel without the explicit ${CONFIRMATION} acknowledgement`,
  );
}

const requestedEnvironment = process.argv
  .find((argument) => argument.startsWith("--environment="))
  ?.split("=")[1];

if (
  requestedEnvironment !== undefined &&
  requestedEnvironment !== "all" &&
  requestedEnvironment !== "production" &&
  requestedEnvironment !== "preview"
) {
  throw new Error("--environment must be production, preview or all");
}

const environments: TargetEnvironment[] =
  !requestedEnvironment || requestedEnvironment === "all"
    ? ["production", "preview"]
    : [requestedEnvironment];

const safeDefaults = {
  BILLING_ENABLED: "false",
  STRIPE_TAX_ENABLED: "false",
  AI_INSIGHTS_ENABLED: "false",
  AI_ROLLOUT_MODE: "internal",
  CAREGIVER_SHARING_ENABLED: "false",
  PUSH_NOTIFICATIONS_ENABLED: "false",
  ACCOUNT_IMPORT_ENABLED: "false",
  ADMIN_ENABLED: "false",
  MAINTENANCE_MODE: "false",
  PUBLIC_SIGNUP_MODE: "closed",
  AI_CONSENT_VERSION: "ai-insights-2026-08",
  AI_MONTHLY_REQUEST_BUDGET: "1000",
  AI_MAX_CONCURRENCY: "5",
  AI_TIMEOUT_MS: "15000",
  LEGAL_TERMS_VERSION: "terms-2026-08",
  LEGAL_PRIVACY_VERSION: "privacy-2026-08",
  HEALTH_DATA_CONSENT_VERSION: "health-data-2026-08",
  LAUNCH_COUNTRY: "FR",
  MINIMUM_AGE: "18",
} as const;

for (const environment of environments) {
  const defaults = {
    ...safeDefaults,
    ...(environment === "production"
      ? { BETTER_AUTH_URL: "https://moodday.app" }
      : {}),
  };

  for (const [key, value] of Object.entries(defaults)) {
    execFileSync(
      "vercel",
      [
        "env",
        "add",
        key,
        environment,
        "--value",
        value,
        "--no-sensitive",
        "--force",
        "--yes",
      ],
      { stdio: "ignore" },
    );
    console.log(`[OK] ${environment}: ${key}`);
  }
}

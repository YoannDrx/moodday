import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const getNonEmptyEnv = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const externalBaseUrl = getNonEmptyEnv(process.env.PLAYWRIGHT_TEST_BASE_URL);
const serverUrl = externalBaseUrl ?? "http://localhost:3000";
const databaseGuardAlreadyConfigured =
  process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED === "true";
const playwrightDatabaseUrl = getNonEmptyEnv(
  process.env.PLAYWRIGHT_DATABASE_URL,
);

if (!playwrightDatabaseUrl) {
  throw new Error(
    "PLAYWRIGHT_DATABASE_URL is required. Use an isolated Neon branch or a disposable local database for E2E tests.",
  );
}

const playwrightDatabaseUrlUnpooled =
  getNonEmptyEnv(process.env.PLAYWRIGHT_DATABASE_URL_UNPOOLED) ??
  playwrightDatabaseUrl;

if (
  !databaseGuardAlreadyConfigured &&
  process.env.DATABASE_URL &&
  playwrightDatabaseUrl === process.env.DATABASE_URL &&
  process.env.PLAYWRIGHT_ALLOW_SHARED_DATABASE !== "true"
) {
  throw new Error(
    "E2E tests cannot reuse DATABASE_URL by default. Provide an isolated PLAYWRIGHT_DATABASE_URL.",
  );
}

process.env.DATABASE_URL = playwrightDatabaseUrl;
process.env.DATABASE_URL_UNPOOLED = playwrightDatabaseUrlUnpooled;
process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED = "true";

const isolatedServiceEnv = {
  RESEND_API_KEY: "",
  RESEND_AUDIENCE_ID: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
};

Object.assign(process.env, isolatedServiceEnv);

const HEADLESS = process.env.HEADLESS
  ? process.env.HEADLESS.toLowerCase() === "true"
  : true;

const config: PlaywrightTestConfig = {
  // 50 seconds
  timeout: 70 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Add retry options
  retries: 1,
  // Add delay between retries
  workers: 3,
  globalTeardown: require.resolve("./e2e/global-teardown.ts"),
  // Enable console logs in CI
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    launchOptions: {
      slowMo: 200,
    },
    headless: HEADLESS,
    contextOptions: {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
      },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    },
    ignoreHTTPSErrors: true,
    video: "on-first-retry",
    baseURL: serverUrl,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 2.3488, latitude: 48.8534 },
    permissions: ["geolocation"],
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  testDir: "e2e",
  // Only start the web server if PLAYWRIGHT_TEST_BASE_URL is not set
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: "pnpm run build && pnpm run start",
          url: serverUrl,
          timeout: 120 * 1000,
          reuseExistingServer:
            process.env.NODE_ENV === "development" ? !process.env.CI : true,
          env: {
            DATABASE_URL: playwrightDatabaseUrl,
            DATABASE_URL_UNPOOLED: playwrightDatabaseUrlUnpooled,
            ...isolatedServiceEnv,
          },
        },
      }),
};

export default config;

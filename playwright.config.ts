import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const getNonEmptyEnv = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const externalBaseUrl = getNonEmptyEnv(process.env.PLAYWRIGHT_TEST_BASE_URL);
const playwrightPort =
  getNonEmptyEnv(process.env.PLAYWRIGHT_TEST_PORT) ??
  (process.env.CI ? "3000" : "3100");
// WebAuthn requires a registrable RP ID (an IP address is invalid), while
// localhost remains a secure-context exception for browser automation.
const serverUrl = externalBaseUrl ?? `http://localhost:${playwrightPort}`;
const getIsolatedSecret = (value: string | undefined, fallback: string) =>
  externalBaseUrl ? (getNonEmptyEnv(value) ?? fallback) : fallback;
const databaseGuardAlreadyConfigured =
  process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED === "true";
const playwrightDatabaseUrl = getNonEmptyEnv(
  process.env.PLAYWRIGHT_DATABASE_URL,
);
const isPlaywrightCommand =
  process.env.PLAYWRIGHT_REQUIRE_DATABASE_GUARD === "true" ||
  process.argv.some((argument) => /playwright(?:\/|\\|$)/i.test(argument));

if (isPlaywrightCommand && !playwrightDatabaseUrl) {
  throw new Error(
    "PLAYWRIGHT_DATABASE_URL is required. Use an isolated Neon branch or a disposable local database for E2E tests.",
  );
}

const playwrightDatabaseUrlUnpooled =
  getNonEmptyEnv(process.env.PLAYWRIGHT_DATABASE_URL_UNPOOLED) ??
  playwrightDatabaseUrl ??
  "postgresql://playwright-static-inspection@127.0.0.1:5432/playwright";
const effectivePlaywrightDatabaseUrl =
  playwrightDatabaseUrl ?? playwrightDatabaseUrlUnpooled;

if (
  !databaseGuardAlreadyConfigured &&
  process.env.DATABASE_URL &&
  effectivePlaywrightDatabaseUrl === process.env.DATABASE_URL &&
  process.env.PLAYWRIGHT_ALLOW_SHARED_DATABASE !== "true"
) {
  throw new Error(
    "E2E tests cannot reuse DATABASE_URL by default. Provide an isolated PLAYWRIGHT_DATABASE_URL.",
  );
}

process.env.DATABASE_URL = effectivePlaywrightDatabaseUrl;
process.env.DATABASE_URL_UNPOOLED = playwrightDatabaseUrlUnpooled;
process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED = "true";

const isolatedServiceEnv = {
  PLAYWRIGHT_DATABASE_GUARD_CONFIGURED: "true",
  // Satisfy fail-closed feature configuration without contacting Resend: all
  // browser-test recipients use the reserved playwright-test-* prefix and are
  // short-circuited by sendEmail.
  RESEND_API_KEY: "re_playwright_test_only_not_a_provider_credential",
  RESEND_AUDIENCE_ID: "",
  CRON_SECRET: getIsolatedSecret(
    process.env.CRON_SECRET,
    "playwright-test-only-cron-secret",
  ),
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  CAREGIVER_SHARING_ENABLED: "true",
  ACCOUNT_IMPORT_ENABLED: "true",
  BETTER_AUTH_URL: serverUrl,
  // A separately started CI server and the runner must share the generated
  // secrets. For Playwright-managed local servers, fixed test-only values keep
  // dotenv precedence from affecting auth tokens.
  BETTER_AUTH_SECRET: getIsolatedSecret(
    process.env.BETTER_AUTH_SECRET,
    "moodday-playwright-only-secret-00000000000000000000000000000000",
  ),
};

Object.assign(process.env, isolatedServiceEnv);

const HEADLESS = process.env.HEADLESS
  ? process.env.HEADLESS.toLowerCase() === "true"
  : true;
const chromiumOnlyPasskeySpec = /passkey\.chromium\.spec\.ts/;

const config: PlaywrightTestConfig = {
  // 50 seconds
  timeout: 70 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testIgnore: chromiumOnlyPasskeySpec,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testIgnore: chromiumOnlyPasskeySpec,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chromium",
      testIgnore: chromiumOnlyPasskeySpec,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-webkit",
      testIgnore: chromiumOnlyPasskeySpec,
      use: { ...devices["iPhone 15"] },
    },
  ],
  // Release evidence must never turn a transient first failure into a green
  // check. Flaky scenarios need to fail visibly and be fixed at the source.
  retries: 0,
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
    },
    ignoreHTTPSErrors: true,
    video: "retain-on-failure",
    baseURL: serverUrl,
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
          command: `pnpm run build && pnpm run start -H 127.0.0.1 -p ${playwrightPort}`,
          url: serverUrl,
          timeout: 120 * 1000,
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true",
          env: {
            DATABASE_URL: effectivePlaywrightDatabaseUrl,
            DATABASE_URL_UNPOOLED: playwrightDatabaseUrlUnpooled,
            ...isolatedServiceEnv,
          },
        },
      }),
};

export default config;

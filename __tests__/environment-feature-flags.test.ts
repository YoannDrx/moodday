import { afterEach, expect, it, vi } from "vitest";
import type * as EnvNext from "@t3-oss/env-nextjs";
import type * as EnvModule from "@/lib/env";
vi.unmock("@/lib/env");
const variables = vi.hoisted(() => ({ values: {} as Record<string, string> }));
vi.mock("@t3-oss/env-nextjs", async (importOriginal) => {
  const actual = await importOriginal<typeof EnvNext>();
  return {
    createEnv: (options: Parameters<typeof actual.createEnv>[0]) =>
      actual.createEnv({
        ...options,
        experimental__runtimeEnv: undefined,
        isServer: true,
        runtimeEnv: variables.values,
      }),
  };
});
afterEach(() => vi.resetModules());
it.each(["true", "false"])(
  "parses explicit deployment feature flags as %s",
  async (value) => {
    vi.resetModules();
    const flags = [
      "OAUTH_GOOGLE_ENABLED",
      "OAUTH_APPLE_ENABLED",
      "OAUTH_GITHUB_ENABLED",
      "BILLING_ENABLED",
      "CAREGIVER_SHARING_ENABLED",
      "GOOGLE_CALENDAR_ENABLED",
      "HEALTHKIT_ENABLED",
      "PUSH_NOTIFICATIONS_ENABLED",
      "ACCOUNT_IMPORT_ENABLED",
      "ADMIN_ENABLED",
      "MAINTENANCE_MODE",
      "STRIPE_TAX_ENABLED",
      "AI_INSIGHTS_ENABLED",
    ];
    variables.values = {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "synthetic-test-secret-not-a-credential",
      ...Object.fromEntries(flags.map((flag) => [flag, value])),
    };
    const { env } = await vi.importActual<typeof EnvModule>("@/lib/env");
    for (const flag of flags)
      expect(env[flag as keyof typeof env]).toBe(value === "true");
    expect(env.MINIMUM_AGE).toBe(18);
    expect(env.LAUNCH_COUNTRY).toBe("FR");
  },
);

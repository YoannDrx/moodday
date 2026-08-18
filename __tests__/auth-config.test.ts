import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

type AuthConfig = {
  socialProviders: Record<string, { clientId: string; clientSecret: string }>;
  rateLimit: { max: number; customRules: Record<string, { max: number }> };
  databaseHooks: {
    session: {
      create: { after: (session: Record<string, unknown>) => Promise<void> };
    };
    user: {
      create: {
        after: (
          user: Record<string, unknown>,
          request?: unknown,
        ) => Promise<void>;
      };
    };
  };
  emailAndPassword: {
    sendResetPassword: (params: {
      user: { id: string; email: string; name?: string | null };
      url: string;
    }) => Promise<void>;
  };
  user: {
    changeEmail: {
      sendChangeEmailVerification: (params: {
        newEmail: string;
        url: string;
        user: { id: string; name?: string | null };
      }) => Promise<void>;
    };
    deleteUser: {
      beforeDelete: (user: { id: string; email: string }) => Promise<void>;
      sendDeleteAccountVerification: (params: {
        user: { id: string; email: string; name?: string | null };
        token: string;
      }) => Promise<void>;
    };
  };
  emailVerification: {
    sendVerificationEmail: (params: {
      user: { id: string; email: string; name?: string | null };
      url: string;
    }) => Promise<void>;
  };
  plugins: { kind: string; options?: Record<string, unknown> }[];
};

const state = vi.hoisted(() => ({
  config: undefined as AuthConfig | undefined,
  env: {} as Record<string, unknown>,
  sendEmail: vi.fn(),
  setupResendCustomer: vi.fn(),
  notifySignificantNewSession: vi.fn(),
  deleteUserDataOutsideAuthCascade: vi.fn(),
  loggerError: vi.fn(),
  getOperationalErrorCode: vi.fn(() => "safe_error"),
  getOperationalSubjectReference: vi.fn(() => "subject-reference"),
}));

vi.mock("better-auth", () => ({
  betterAuth: (config: AuthConfig) => {
    state.config = config;
    return { api: {} };
  },
}));
vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: () => ({ adapter: "prisma" }),
}));
vi.mock("better-auth/next-js", () => ({
  nextCookies: () => ({ kind: "next-cookies" }),
}));
vi.mock("better-auth/plugins", () => ({
  admin: (options: Record<string, unknown>) => ({ kind: "admin", options }),
  magicLink: (options: Record<string, unknown>) => ({
    kind: "magic-link",
    options,
  }),
  twoFactor: (options: Record<string, unknown>) => ({
    kind: "two-factor",
    options,
  }),
}));
vi.mock("@better-auth/passkey", () => ({
  passkey: (options: Record<string, unknown>) => ({ kind: "passkey", options }),
}));
vi.mock("@/lib/mail/send-email", () => ({ sendEmail: state.sendEmail }));
vi.mock("@/lib/auth/auth-config-setup", () => ({
  setupResendCustomer: state.setupResendCustomer,
}));
vi.mock("@/lib/env", () => ({ env: state.env }));
vi.mock("@/lib/logger", () => ({
  logger: { error: state.loggerError },
}));
vi.mock("@/lib/server-url", () => ({
  getServerUrl: () => "https://moodday.app",
  getTrustedAuthOrigins: () => ["https://moodday.app"],
  getPasskeyOrigin: () => "https://moodday.app",
}));
vi.mock("@/lib/user/delete-user-data", () => ({
  deleteUserDataOutsideAuthCascade: state.deleteUserDataOutsideAuthCascade,
}));
vi.mock("@/lib/auth/new-session-alert", () => ({
  notifySignificantNewSession: state.notifySignificantNewSession,
}));
vi.mock("@/lib/operations/log-identifiers", () => ({
  getOperationalErrorCode: state.getOperationalErrorCode,
  getOperationalSubjectReference: state.getOperationalSubjectReference,
}));
vi.mock("@email/auth/account-deleted", () => ({ default: vi.fn(() => null) }));
vi.mock("@email/auth/email-changed", () => ({ default: vi.fn(() => null) }));
vi.mock("@email/auth/magic-link", () => ({ default: vi.fn(() => null) }));
vi.mock("@email/auth/reset-password", () => ({ default: vi.fn(() => null) }));
vi.mock("@email/auth/verify-email", () => ({ default: vi.fn(() => null) }));

import { prisma } from "@/lib/prisma";

const baseEnv = () => ({
  GITHUB_CLIENT_ID: "github-client",
  GITHUB_CLIENT_SECRET: "github-secret",
  GOOGLE_CLIENT_ID: "google-client",
  GOOGLE_CLIENT_SECRET: "google-secret",
  LEGAL_TERMS_VERSION: "terms-2026-08",
  LEGAL_PRIVACY_VERSION: "privacy-2026-08",
  HEALTH_DATA_CONSENT_VERSION: "health-2026-08",
  LAUNCH_COUNTRY: "FR",
  MINIMUM_AGE: 18,
});

const loadConfig = async (
  envOverrides: Record<string, unknown> = {},
  isolatedRateLimit = false,
) => {
  for (const key of Object.keys(state.env))
    Reflect.deleteProperty(state.env, key);
  Object.assign(state.env, baseEnv(), envOverrides);
  if (isolatedRateLimit) {
    process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED = "true";
  } else {
    delete process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED;
  }
  state.config = undefined;
  vi.resetModules();
  await import("@/lib/auth");
  expect(state.config).toBeDefined();
  return state.config as unknown as AuthConfig;
};

describe("Better Auth production configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.setupResendCustomer.mockResolvedValue(undefined);
    state.notifySignificantNewSession.mockResolvedValue(undefined);
    state.sendEmail.mockResolvedValue(undefined);
    state.deleteUserDataOutsideAuthCascade.mockResolvedValue(undefined);
    vi.mocked(prisma.userConsent.createMany).mockResolvedValue({ count: 4 });
  });

  afterAll(() => {
    delete process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED;
  });

  it("enables only fully configured social providers and production rate limits", async () => {
    const config = await loadConfig();
    expect(config.socialProviders).toEqual({
      github: { clientId: "github-client", clientSecret: "github-secret" },
      google: { clientId: "google-client", clientSecret: "google-secret" },
    });
    expect(config.rateLimit.max).toBe(60);
    expect(config.rateLimit.customRules["/sign-in/email"].max).toBe(5);
    expect(
      config.rateLimit.customRules["/request-password-reset"].max,
    ).toBe(3);

    const isolated = await loadConfig(
      {
        GITHUB_CLIENT_SECRET: undefined,
        GOOGLE_CLIENT_ID: undefined,
      },
      true,
    );
    expect(isolated.socialProviders).toEqual({});
    expect(isolated.rateLimit.max).toBe(1000);
    expect(
      isolated.rateLimit.customRules["/request-password-reset"].max,
    ).toBe(1000);
  });

  it("records signup consents only when every submitted version is current", async () => {
    const config = await loadConfig();
    const afterCreate = config.databaseHooks.user.create.after;
    const validUser = {
      id: "user-1",
      email: "alice@example.test",
      age18Accepted: true,
      termsVersionAccepted: "terms-2026-08",
      privacyVersionAccepted: "privacy-2026-08",
      healthDataConsentVersionAccepted: "health-2026-08",
      signupLocale: "en",
      launchCountry: "FR",
    };

    await afterCreate(validUser);
    expect(prisma.userConsent.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ purpose: "age_18", locale: "en" }),
        expect.objectContaining({ purpose: "terms", locale: "en" }),
        expect.objectContaining({ purpose: "privacy", locale: "en" }),
        expect.objectContaining({ purpose: "health_data", locale: "en" }),
      ]),
      skipDuplicates: true,
    });

    vi.mocked(prisma.userConsent.createMany).mockClear();
    await afterCreate({ ...validUser, signupLocale: "fr" });
    expect(prisma.userConsent.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ purpose: "age_18", locale: "fr" }),
        expect.objectContaining({ purpose: "health_data", locale: "fr" }),
      ]),
      skipDuplicates: true,
    });

    const invalidVariants = [
      { age18Accepted: false },
      { termsVersionAccepted: "old" },
      { privacyVersionAccepted: "old" },
      { healthDataConsentVersionAccepted: "old" },
      { launchCountry: "BE" },
    ];
    vi.mocked(prisma.userConsent.createMany).mockClear();
    await Promise.all(
      invalidVariants.map(async (variant) =>
        afterCreate({ ...validUser, signupLocale: "fr", ...variant }),
      ),
    );
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
  });

  it("keeps optional provider hooks non-blocking and logs safe session failures", async () => {
    const config = await loadConfig();
    state.setupResendCustomer.mockRejectedValueOnce(new Error("private"));
    await config.databaseHooks.user.create.after({
      id: "user-2",
      email: "bob@example.test",
    });
    expect(state.loggerError).toHaveBeenCalledWith(
      "Failed to create Resend contact",
      { errorCode: "resend_contact_failed" },
    );

    state.notifySignificantNewSession.mockRejectedValueOnce(
      new Error("private session detail"),
    );
    await config.databaseHooks.session.create.after({
      id: "session-1",
      userId: "user-2",
      userAgent: "Browser",
      ipAddress: "192.0.2.1",
      createdAt: new Date(),
    });
    expect(state.loggerError).toHaveBeenCalledWith(
      "New session alert delivery failed",
      expect.objectContaining({
        errorCode: "safe_error",
        subjectReference: "subject-reference",
      }),
    );

    state.notifySignificantNewSession.mockResolvedValueOnce(undefined);
    await config.databaseHooks.session.create.after({
      id: "session-2",
      userId: "user-2",
      createdAt: new Date(),
    });
  });

  it("sends every identity email and delegates pre-delete cleanup", async () => {
    const config = await loadConfig();
    const user = {
      id: "user-1",
      email: "alice@example.test",
      name: "Alice",
    };
    await config.emailAndPassword.sendResetPassword({
      user,
      url: "https://moodday.app/reset",
    });
    await config.user.changeEmail.sendChangeEmailVerification({
      newEmail: "new@example.test",
      url: "https://moodday.app/change-email",
      user: { id: user.id, name: null },
    });
    await config.user.deleteUser.beforeDelete(user);
    await config.user.deleteUser.sendDeleteAccountVerification({
      user,
      token: "delete-token",
    });
    await config.user.deleteUser.sendDeleteAccountVerification({
      user: { ...user, name: null },
      token: "delete-token-2",
    });
    await config.emailVerification.sendVerificationEmail({
      user,
      url: "https://moodday.app/verify",
    });
    await config.emailVerification.sendVerificationEmail({
      user: { ...user, name: null },
      url: "https://moodday.app/verify-2",
    });

    const magicLinkPlugin = config.plugins.find(
      (plugin) => plugin.kind === "magic-link",
    );
    const sendMagicLink = magicLinkPlugin?.options?.sendMagicLink as
      | ((params: { email: string; url: string }) => Promise<void>)
      | undefined;
    if (!sendMagicLink) throw new Error("Magic-link callback not captured");
    await sendMagicLink({
      email: user.email,
      url: "https://moodday.app/magic",
    });

    expect(state.sendEmail).toHaveBeenCalledTimes(7);
    expect(state.deleteUserDataOutsideAuthCascade).toHaveBeenCalledWith(user);
  });
});

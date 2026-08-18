import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ api: { getSession: vi.fn() } }));
const getFeatureAvailability = vi.hoisted(() => vi.fn());
const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
  unauthorized: vi.fn(() => {
    throw new Error("NEXT_UNAUTHORIZED");
  }),
}));
const requestHeaders = vi.hoisted(() => new Headers({ host: "localhost" }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/features/availability", () => ({ getFeatureAvailability }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => requestHeaders),
}));
vi.mock("next/navigation", () => navigation);
vi.unmock("@/lib/auth/auth-user");

import {
  RECENT_AUTHENTICATION_WINDOW_MS,
  getAuthorizedApiUser,
  getRequiredAdmin,
  getRequiredRecentUser,
  getRequiredUser,
  getRequiredVerifiedUser,
  getSession,
  getUser,
} from "@/lib/auth/auth-user";

const mutableEnv = env as unknown as {
  MINIMUM_AGE: number;
  LEGAL_TERMS_VERSION: string;
  LEGAL_PRIVACY_VERSION: string;
  HEALTH_DATA_CONSENT_VERSION: string;
};

const user = { id: "user-1", email: "verified@example.test" };

const currentSession = (createdAt: Date | string = new Date()) => ({
  user,
  session: { id: "session-1", createdAt },
});

const currentConsents = () => [
  { purpose: "age_18" },
  { purpose: "terms" },
  { purpose: "privacy" },
  { purpose: "health_data" },
];

describe("server authentication guards", () => {
  beforeEach(() => {
    mutableEnv.MINIMUM_AGE = 18;
    mutableEnv.LEGAL_TERMS_VERSION = "terms-v1";
    mutableEnv.LEGAL_PRIVACY_VERSION = "privacy-v1";
    mutableEnv.HEALTH_DATA_CONSENT_VERSION = "health-data-v1";
    auth.api.getSession.mockReset();
    getFeatureAvailability.mockReset();
    navigation.notFound.mockClear();
    navigation.redirect.mockClear();
    navigation.unauthorized.mockClear();
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.userConsent.findMany).mockReset();
    getFeatureAvailability.mockReturnValue({ enabled: true });
  });

  it("reads the Better Auth session with the incoming headers", async () => {
    const session = currentSession();
    auth.api.getSession.mockResolvedValue(session);

    expect(await getSession()).toEqual(session);
    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: requestHeaders,
    });
  });

  it("returns null without a session user and returns the session identity otherwise", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);
    expect(await getUser()).toBeNull();

    auth.api.getSession.mockResolvedValueOnce(currentSession());
    expect(await getUser()).toEqual(user);
  });

  it("fails closed for API access without a user or verified email", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);
    expect(await getAuthorizedApiUser()).toBeNull();

    auth.api.getSession.mockResolvedValueOnce(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      emailVerified: false,
    } as never);
    expect(await getAuthorizedApiUser()).toBeNull();
  });

  it("fails closed for API access when a required consent is missing", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([
      { purpose: "age_18" },
      { purpose: "terms" },
    ] as never);

    expect(await getAuthorizedApiUser()).toBeNull();
  });

  it("authorizes verified API users with all current consents", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue(
      currentConsents() as never,
    );

    expect(await getAuthorizedApiUser()).toEqual(user);
    expect(prisma.userConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          revokedAt: null,
          OR: [
            { purpose: "age_18", version: "18" },
            { purpose: "terms", version: "terms-v1" },
            { purpose: "privacy", version: "privacy-v1" },
            { purpose: "health_data", version: "health-data-v1" },
          ],
        }),
      }),
    );
  });

  it("stops unauthenticated page access and redirects unverified identities", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);
    await expect(getRequiredVerifiedUser()).rejects.toThrow(
      "NEXT_UNAUTHORIZED",
    );

    auth.api.getSession.mockResolvedValueOnce(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    await expect(getRequiredVerifiedUser()).rejects.toThrow(
      "NEXT_REDIRECT:/auth/verify",
    );
  });

  it("returns a verified page user", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);

    expect(await getRequiredVerifiedUser()).toEqual(user);
  });

  it("redirects verified users with stale legal consent", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([]);

    await expect(getRequiredUser()).rejects.toThrow(
      "NEXT_REDIRECT:/auth/consent",
    );
  });

  it("returns a fully authorized page user", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue(
      currentConsents() as never,
    );

    expect(await getRequiredUser()).toEqual(user);
  });

  it.each([
    { label: "missing session", session: null },
    {
      label: "invalid timestamp",
      session: { user, session: { createdAt: "invalid" } },
    },
    {
      label: "expired session",
      session: currentSession(
        new Date(Date.now() - RECENT_AUTHENTICATION_WINDOW_MS - 1),
      ),
    },
  ])("requires recent authentication for $label", async ({ session }) => {
    auth.api.getSession.mockResolvedValue(session as never);

    await expect(getRequiredRecentUser()).rejects.toThrow(
      "Recent authentication required",
    );
  });

  it("accepts a recent session only after the normal product gates", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue(
      currentConsents() as never,
    );

    expect(await getRequiredRecentUser()).toEqual(user);
  });

  it("hides the admin surface when disabled", async () => {
    getFeatureAvailability.mockReturnValue({ enabled: false });

    await expect(getRequiredAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("rejects non-admin users after the normal product gates", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ emailVerified: true } as never)
      .mockResolvedValueOnce({
        role: "user",
        twoFactorEnabled: true,
      } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue(
      currentConsents() as never,
    );

    await expect(getRequiredAdmin()).rejects.toThrow("NEXT_UNAUTHORIZED");
  });

  it("requires MFA for an administrator", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ emailVerified: true } as never)
      .mockResolvedValueOnce({
        role: "admin",
        twoFactorEnabled: false,
      } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue(
      currentConsents() as never,
    );

    await expect(getRequiredAdmin()).rejects.toThrow(
      "NEXT_REDIRECT:/settings/security?adminMfaRequired=true",
    );
  });

  it("returns an administrator with fresh role and MFA state", async () => {
    auth.api.getSession.mockResolvedValue(currentSession());
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ emailVerified: true } as never)
      .mockResolvedValueOnce({
        role: "admin",
        twoFactorEnabled: true,
      } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue(
      currentConsents() as never,
    );

    expect(await getRequiredAdmin()).toEqual({ ...user, role: "admin" });
  });
});

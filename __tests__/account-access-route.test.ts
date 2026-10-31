import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  consents: vi.fn(),
  assertWritesAvailable: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/auth-user", () => ({
  getUser: mocks.getUser,
  hasCurrentRequiredConsents: mocks.consents,
}));
vi.mock("@/lib/maintenance", () => ({
  assertWritesAvailable: mocks.assertWritesAvailable,
}));
import { GET, POST } from "@app/api/v2/account-access/route";
import { getRequiredConsentVersions } from "@/lib/auth/required-consents";

const context = { params: Promise.resolve({}) };
const input = () => ({
  age18Accepted: true,
  termsAccepted: true,
  privacyAccepted: true,
  healthDataConsentAccepted: true,
  locale: "fr",
  versions: getRequiredConsentVersions(),
});
const request = (body: unknown, headers?: Record<string, string>) => {
  const result = new Request("https://moodday.example/api/v2/account-access", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  // Happy DOM strips Origin during Request construction as a browser would.
  // Route tests model the server request, where that header is present.
  if (headers?.origin) result.headers.set("origin", headers.origin);
  return result;
};

describe("native account access and explicit consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ id: "owner-1" });
    mocks.consents.mockResolvedValue(false);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: true,
    } as never);
    vi.mocked(prisma.userConsent.createMany).mockResolvedValue({ count: 4 });
    Object.assign(env, {
      BETTER_AUTH_URL: "https://public.moodday.example",
      LEGAL_TERMS_VERSION: "terms-test",
      LEGAL_PRIVACY_VERSION: "privacy-test",
      HEALTH_DATA_CONSENT_VERSION: "health-test",
    });
  });
  it("lets a new verified social account read only the consent gate", async () => {
    const response = await GET(
      new Request("https://moodday.example/api/v2/account-access"),
      context,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      data: {
        emailVerified: true,
        consentsAccepted: false,
        versions: getRequiredConsentVersions(),
      },
    });
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
  });
  it("accepts the configured public origin behind a reverse proxy", async () => {
    mocks.consents.mockResolvedValue(true);
    expect(
      (
        await POST(
          request(input(), { origin: "https://public.moodday.example" }),
          context,
        )
      ).status,
    ).toBe(200);
  });
  it("rejects an unauthenticated or deleted account", async () => {
    mocks.getUser.mockResolvedValueOnce(null);
    expect(
      (
        await GET(
          new Request("https://moodday.example/api/v2/account-access"),
          context,
        )
      ).status,
    ).toBe(401);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    expect((await POST(request(input()), context)).status).toBe(401);
  });
  it("rejects unverified email before recording any consent", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      emailVerified: false,
    } as never);
    expect((await POST(request(input()), context)).status).toBe(403);
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
  });
  it.each([
    "age18Accepted",
    "termsAccepted",
    "privacyAccepted",
    "healthDataConsentAccepted",
  ])("requires explicit %s", async (field) => {
    expect(
      (await POST(request({ ...input(), [field]: false }), context)).status,
    ).toBe(400);
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
  });
  it("rejects texts changed since display without silently accepting new versions", async () => {
    const response = await POST(
      request({
        ...input(),
        versions: { ...getRequiredConsentVersions(), terms: "old-version" },
      }),
      context,
    );
    expect(response.status).toBe(409);
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
  });
  it("rejects cross-origin submissions and maintenance writes", async () => {
    expect(
      (
        await POST(
          request(input(), { origin: "https://attacker.example" }),
          context,
        )
      ).status,
    ).toBe(403);
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
    mocks.assertWritesAvailable.mockImplementationOnce(() => {
      throw new Error("maintenance");
    });
    expect((await POST(request(input()), context)).status).toBe(500);
    expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
  });
  it("records four idempotent consents for the session owner, never a submitted owner", async () => {
    mocks.consents.mockResolvedValue(true);
    expect(
      (await POST(request({ ...input(), userId: "another-owner" }), context))
        .status,
    ).toBe(200);
    expect(prisma.userConsent.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: "owner-1",
          purpose: "age_18",
          version: "18",
        }),
        expect.objectContaining({
          userId: "owner-1",
          purpose: "terms",
          version: "terms-test",
        }),
        expect.objectContaining({
          userId: "owner-1",
          purpose: "privacy",
          version: "privacy-test",
        }),
        expect.objectContaining({
          userId: "owner-1",
          purpose: "health_data",
          version: "health-test",
        }),
      ]),
      skipDuplicates: true,
    });
  });
  it("does not report success when a consent remains revoked", async () => {
    const response = await POST(request(input()), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "consent_revoked" },
    });
  });
});

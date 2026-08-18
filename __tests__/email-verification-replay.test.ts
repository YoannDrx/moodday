import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { claimEmailVerificationToken } from "@/lib/auth/email-verification-replay";

const mutableEnv = env as unknown as { BETTER_AUTH_SECRET: string };
const AUTH_SECRET = "test-auth-secret-at-least-32-characters";

const createToken = ({
  expiresAt = new Date("2026-08-13T13:00:00.000Z"),
  secret = AUTH_SECRET,
}: {
  expiresAt?: Date;
  secret?: string;
} = {}) => {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      email: "verified@example.test",
      exp: Math.floor(expiresAt.getTime() / 1000),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
};

describe("email verification anti-replay", () => {
  beforeEach(() => {
    mutableEnv.BETTER_AUTH_SECRET = AUTH_SECRET;
    vi.mocked(prisma.verification.create).mockReset();
    vi.mocked(prisma.verification.create).mockResolvedValue({} as never);
  });

  it("stores only a deterministic HMAC claim, never the raw token", async () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    const token = createToken();

    await expect(claimEmailVerificationToken(token, now)).resolves.toBe(true);
    const call = vi.mocked(prisma.verification.create).mock.calls[0]?.[0];
    expect(call.data).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^moodday-email-verification:[a-f0-9]{64}$/),
        identifier: "moodday-email-verification-consumed",
        value: "consumed",
        expiresAt: new Date("2026-08-13T13:00:00.000Z"),
      }),
    );
    expect(JSON.stringify(call)).not.toContain(token);
  });

  it.each([
    "",
    "x".repeat(4_097),
    "not-a-jwt",
    createToken({ secret: "different-secret-at-least-32-chars" }),
    createToken({ expiresAt: new Date("2026-08-13T11:59:59.000Z") }),
  ])(
    "rejects an unsafe, invalid or expired token without writing",
    async (token) => {
      await expect(
        claimEmailVerificationToken(
          token,
          new Date("2026-08-13T12:00:00.000Z"),
        ),
      ).resolves.toBe(false);
      expect(prisma.verification.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    "..",
    `${Buffer.from("not-json").toString("base64url")}.payload.signature`,
    `${Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url")}.${Buffer.from(
      JSON.stringify({ email: "verified@example.test", exp: 9_999_999_999 }),
    ).toString("base64url")}.signature`,
    `${Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url")}.${Buffer.from(
      JSON.stringify({ email: 123, exp: "tomorrow" }),
    ).toString("base64url")}.signature`,
  ])("rejects malformed JWT structures", async (token) => {
    await expect(
      claimEmailVerificationToken(token, new Date("2026-08-13T12:00:00.000Z")),
    ).resolves.toBe(false);
    expect(prisma.verification.create).not.toHaveBeenCalled();
  });

  it("rejects a replay and propagates unrelated database failures", async () => {
    const token = createToken();
    vi.mocked(prisma.verification.create).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    await expect(
      claimEmailVerificationToken(token, new Date("2026-08-13T12:00:00.000Z")),
    ).resolves.toBe(false);

    vi.mocked(prisma.verification.create).mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    await expect(
      claimEmailVerificationToken(token, new Date("2026-08-13T12:00:00.000Z")),
    ).rejects.toThrow("database unavailable");
  });
});

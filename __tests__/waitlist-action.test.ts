import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
  sendEmail: vi.fn(),
  headers: new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
}));

vi.mock("@/lib/actions/safe-actions", () => ({ action: actionClient }));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("@/lib/mail/send-email", () => ({ sendEmail: mocks.sendEmail }));

import { joinWaitlistAction } from "@/features/landing/waitlist.action";

const join = joinWaitlistAction as unknown as (input: {
  parsedInput: {
    email: string;
    locale: "fr" | "en";
    door?: "cycle" | "partner" | null;
    consent?: true;
  };
}) => Promise<{ joined: boolean }>;

describe("joinWaitlistAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceRateLimit.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue({ error: null, data: { id: "email" } });
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.newsletterSubscriber.upsert).mockResolvedValue(
      {} as never,
    );
  });

  it("stores a normalized address once, tagged as waitlist", async () => {
    await expect(
      join({ parsedInput: { email: " Future@Example.COM ", locale: "en" } }),
    ).resolves.toEqual({ joined: true });

    expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
      where: { email: "future@example.com" },
      create: {
        email: "future@example.com",
        locale: "en",
        source: "waitlist",
        door: undefined,
        consentAt: expect.any(Date),
      },
      update: {},
    });
  });

  it("rate limits by client IP and by address before writing", async () => {
    mocks.enforceRateLimit
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Too many requests"));

    await expect(
      join({ parsedInput: { email: "spam@example.com", locale: "fr" } }),
    ).rejects.toThrow("Too many requests");

    expect(mocks.enforceRateLimit).toHaveBeenNthCalledWith(1, {
      scope: "public-waitlist-ip",
      identifier: "203.0.113.7",
      max: 10,
      windowSeconds: 3600,
    });
    expect(mocks.enforceRateLimit).toHaveBeenNthCalledWith(2, {
      scope: "public-waitlist-email",
      identifier: "spam@example.com",
      max: 3,
      windowSeconds: 3600,
    });
    expect(prisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it("confirms a new subscription by email, but not a repeated one", async () => {
    await join({ parsedInput: { email: "new@example.com", locale: "fr" } });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@example.com",
        tracking: { template: "waitlist-confirmation" },
      }),
    );

    mocks.sendEmail.mockClear();
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue({
      id: "known",
    } as never);
    await expect(
      join({ parsedInput: { email: "new@example.com", locale: "fr" } }),
    ).resolves.toEqual({ joined: true });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

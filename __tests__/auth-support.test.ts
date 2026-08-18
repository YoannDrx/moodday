import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const mocks = vi.hoisted(() => ({
  createContact: vi.fn(),
}));
vi.mock("@/lib/mail/resend", () => ({
  getResend: () => ({ contacts: { create: mocks.createContact } }),
}));

import { setupResendCustomer } from "@/lib/auth/auth-config-setup";
import {
  ADDITIONAL_FEATURES,
  AUTH_PLANS_DATA,
  LIMITS_CONFIG,
  getPlanLimits,
} from "@/lib/auth/stripe/auth-plans-data";

const mutableEnv = env as unknown as {
  RESEND_API_KEY?: string;
  RESEND_AUDIENCE_ID?: string;
};

const user = {
  id: "user-1",
  email: "member@moodday.invalid",
  emailVerified: true,
  name: "Camille",
  image: null,
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  updatedAt: new Date("2026-08-01T00:00:00.000Z"),
};

describe("auth support configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableEnv.RESEND_API_KEY = "re_test";
    mutableEnv.RESEND_AUDIENCE_ID = "audience-1";
    mocks.createContact.mockResolvedValue({ data: { id: "contact-1" } });
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
  });

  it("creates a configured Resend contact and stores only its provider id", async () => {
    await expect(setupResendCustomer(user)).resolves.toBe("contact-1");
    expect(mocks.createContact).toHaveBeenCalledWith({
      audienceId: "audience-1",
      email: user.email,
      firstName: "Camille",
      unsubscribed: false,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { resendContactId: "contact-1" },
    });
  });

  it("skips optional contact creation for missing email, configuration or provider data", async () => {
    await expect(
      setupResendCustomer({ ...user, email: "" }),
    ).resolves.toBeUndefined();
    mutableEnv.RESEND_API_KEY = undefined;
    await expect(setupResendCustomer(user)).resolves.toBeUndefined();
    mutableEnv.RESEND_API_KEY = "re_test";
    mutableEnv.RESEND_AUDIENCE_ID = undefined;
    await expect(setupResendCustomer(user)).resolves.toBeUndefined();
    mutableEnv.RESEND_AUDIENCE_ID = "audience-1";
    mocks.createContact.mockResolvedValueOnce({ data: null });
    await expect(setupResendCustomer(user)).resolves.toBeUndefined();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("keeps client-safe plan limits and the launch catalogue coherent", () => {
    expect(AUTH_PLANS_DATA).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "free", price: 0, currency: "EUR" }),
        expect.objectContaining({
          name: "plus",
          price: 7.99,
          yearlyPrice: 59.99,
          freeTrial: { days: 14 },
        }),
      ]),
    );
    expect(getPlanLimits("plus")).toEqual(
      expect.objectContaining({ historyDays: -1, caregivers: 3 }),
    );
    expect(getPlanLimits()).toEqual(
      expect.objectContaining({ historyDays: 30, caregivers: 1 }),
    );
    expect(getPlanLimits("unknown" as never)).toEqual(getPlanLimits("free"));
    expect(Object.keys(LIMITS_CONFIG)).toEqual([
      "medications",
      "historyDays",
      "caregivers",
    ]);
    expect(ADDITIONAL_FEATURES.plus).toHaveLength(3);
  });
});

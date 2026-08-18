import type { Subscription } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  templates: {
    welcome: vi.fn((props) => ({ template: "welcome", props })),
    reminder: vi.fn((props) => ({ template: "reminder", props })),
    converted: vi.fn((props) => ({ template: "converted", props })),
    expired: vi.fn((props) => ({ template: "expired", props })),
    canceled: vi.fn((props) => ({ template: "canceled", props })),
    paymentFailed: vi.fn((props) => ({ template: "payment-failed", props })),
    renewal: vi.fn((props) => ({ template: "renewal", props })),
    invoice: vi.fn((props) => ({ template: "invoice", props })),
  },
}));

vi.mock("@/lib/mail/send-email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/logger", () => ({ logger: mocks.logger }));
vi.mock("@/lib/operations/log-identifiers", () => ({
  getOperationalErrorCode: (error: unknown) =>
    error instanceof Error ? error.name : "unknown_error",
  getOperationalSubjectReference: (id: string) => `subject:${id}`,
}));
vi.mock("@email/subscription/trial-welcome", () => ({
  default: mocks.templates.welcome,
}));
vi.mock("@email/subscription/trial-reminder", () => ({
  default: mocks.templates.reminder,
}));
vi.mock("@email/subscription/trial-converted", () => ({
  default: mocks.templates.converted,
}));
vi.mock("@email/subscription/trial-expired", () => ({
  default: mocks.templates.expired,
}));
vi.mock("@email/subscription/subscription-canceled", () => ({
  default: mocks.templates.canceled,
}));
vi.mock("@email/subscription/payment-failed", () => ({
  default: mocks.templates.paymentFailed,
}));
vi.mock("@email/subscription/renewal-success", () => ({
  default: mocks.templates.renewal,
}));
vi.mock("@email/subscription/invoice-available", () => ({
  default: mocks.templates.invoice,
}));

import {
  sendInvoiceAvailableEmail,
  sendPaymentFailedEmail,
  sendRenewalSuccessEmail,
  sendSubscriptionCanceledEmail,
  sendTrialConvertedEmail,
  sendTrialExpiredEmail,
  sendTrialReminderEmail,
  sendTrialWelcomeEmail,
} from "@/lib/auth/stripe/subscription-emails";

const subscription = {
  id: "subscription-1",
  userId: "user-1",
  plan: "plus",
  periodEnd: new Date("2026-09-01T10:00:00.000Z"),
} as unknown as Subscription;

const ctx = {
  req: new Request("https://moodday.invalid/webhook"),
  userId: "user-1",
  stripeCustomerId: "cus_1",
  subscriptionId: "sub_1",
};

const delivered = { error: null, data: { id: "email-1" } };

describe("subscription lifecycle emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendEmail.mockResolvedValue(delivered);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "member@moodday.invalid",
      name: "Camille",
    } as never);
  });

  it("delivers every subscription lifecycle template with auditable tracking", async () => {
    await sendTrialWelcomeEmail(subscription, ctx);
    await sendTrialConvertedEmail({ subscription }, ctx);
    await sendTrialExpiredEmail(subscription, ctx);
    await sendSubscriptionCanceledEmail(subscription, ctx);
    await sendPaymentFailedEmail(
      "user-1",
      "plus",
      new Date("2026-08-20T10:00:00.000Z"),
    );
    await sendRenewalSuccessEmail(
      "user-1",
      "plus",
      "7,99 €",
      new Date("2026-09-13T10:00:00.000Z"),
    );
    await sendInvoiceAvailableEmail(
      "user-1",
      "INV-2026-001",
      "7,99 €",
      new Date("2026-08-13T10:00:00.000Z"),
    );

    expect(mocks.sendEmail).toHaveBeenCalledTimes(7);
    expect(
      mocks.sendEmail.mock.calls.map(([payload]) => payload.tracking.template),
    ).toEqual([
      "trial-welcome",
      "trial-converted",
      "trial-expired",
      "subscription-canceled",
      "payment-failed",
      "renewal-success",
      "invoice-available",
    ]);
    expect(mocks.templates.welcome).toHaveBeenCalledWith(
      expect.objectContaining({ userName: "Camille", planName: "Plus" }),
    );
    expect(mocks.templates.canceled).toHaveBeenCalledWith(
      expect.objectContaining({ endDate: expect.stringContaining("2026") }),
    );
    expect(mocks.templates.invoice).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: "INV-2026-001",
      }),
    );
    expect(mocks.logger.info).toHaveBeenCalledTimes(7);
  });

  it("handles the one-day and multi-day trial reminder variants", async () => {
    const trialSubscription = {
      ...subscription,
      periodEnd: null,
      user: {
        id: "user-1",
        email: "member@moodday.invalid",
        name: null,
      },
    };

    await expect(sendTrialReminderEmail(trialSubscription, 1)).resolves.toBe(
      true,
    );
    await expect(sendTrialReminderEmail(trialSubscription, 3)).resolves.toBe(
      true,
    );

    expect(mocks.sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: expect.stringContaining("Dernier jour"),
      }),
    );
    expect(mocks.sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        subject: expect.stringContaining("3 jours"),
      }),
    );
    expect(mocks.templates.reminder).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userName: "Utilisateur",
        daysLeft: 1,
        trialEndDate: "demain",
      }),
    );
  });

  it("skips delivery when the target account has no usable email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await sendTrialWelcomeEmail(subscription, ctx);
    await sendTrialConvertedEmail({ subscription }, ctx);
    await sendTrialExpiredEmail(subscription, ctx);
    await sendSubscriptionCanceledEmail(subscription, ctx);
    await sendPaymentFailedEmail("user-1", "plus");
    await sendRenewalSuccessEmail(
      "user-1",
      "plus",
      "7,99 €",
      new Date("2026-09-13T10:00:00.000Z"),
    );
    await sendInvoiceAvailableEmail(
      "user-1",
      "INV-1",
      "7,99 €",
      new Date("2026-08-13T10:00:00.000Z"),
    );

    const missingEmailTrial = {
      ...subscription,
      user: { id: "user-1", email: "", name: null },
    };
    await expect(sendTrialReminderEmail(missingEmailTrial, 2)).resolves.toBe(
      false,
    );

    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.logger.warn).toHaveBeenCalledTimes(8);
  });

  it("renders invoice notifications without accepting an external link", async () => {
    await sendInvoiceAvailableEmail(
      "user-1",
      "INV-2026-002",
      "7,99 €",
      new Date("2026-08-13T10:00:00.000Z"),
    );

    expect(mocks.templates.invoice).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceNumber: "INV-2026-002" }),
    );
    expect(mocks.templates.invoice.mock.calls[0]?.[0]).not.toHaveProperty(
      "invoiceUrl",
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("records delivery failures without leaking them from webhook hooks", async () => {
    mocks.sendEmail.mockResolvedValue({
      error: new Error("provider unavailable"),
      data: null,
    });

    await expect(sendTrialWelcomeEmail(subscription, ctx)).resolves.toBe(
      undefined,
    );
    await expect(sendPaymentFailedEmail("user-1", "plus")).resolves.toBe(
      undefined,
    );

    expect(mocks.logger.error).toHaveBeenCalledTimes(2);
    expect(mocks.logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        status: "failed",
        errorCode: "email_delivery_failed",
        subjectReference: "subject:user-1",
      }),
    );
  });

  it("propagates reminder delivery failures so the scheduler can retry", async () => {
    mocks.sendEmail.mockResolvedValue({
      error: new Error("provider unavailable"),
      data: null,
    });
    const trialSubscription = {
      ...subscription,
      user: {
        id: "user-1",
        email: "member@moodday.invalid",
        name: "Camille",
      },
    };

    await expect(sendTrialReminderEmail(trialSubscription, 2)).rejects.toThrow(
      "email_delivery_failed",
    );
    expect(mocks.logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ errorCode: "email_delivery_failed" }),
    );
  });
});

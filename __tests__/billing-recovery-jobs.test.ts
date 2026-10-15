import { beforeEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  run: vi.fn(),
  configured: vi.fn(),
  sync: vi.fn(),
  list: vi.fn(),
  audit: vi.fn(),
  remind: vi.fn(),
}));
vi.mock("@/lib/cron", () => ({ validateCronRequest: mocks.authorize }));
vi.mock("@/lib/operations/job-runner", () => ({
  runOperationalJob: mocks.run,
}));
vi.mock("@/lib/billing/revenuecat", () => ({
  isRevenueCatConfigured: mocks.configured,
  syncRevenueCatCustomer: mocks.sync,
  getSafeRevenueCatErrorCode: () => "safe_error",
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ subscriptions: { list: mocks.list } }),
}));
vi.mock("@/lib/billing/reconciliation", () => ({
  auditSubscriptionReconciliation: mocks.audit,
}));
vi.mock("@/lib/auth/stripe/subscription-emails", () => ({
  sendTrialReminderEmail: mocks.remind,
}));
import { GET as revenuecat } from "@app/api/cron/revenuecat-webhooks/route";
import { GET as stripe } from "@app/api/cron/stripe-reconciliation/route";
import { GET as reminders } from "@app/api/cron/subscription-reminders/route";
const request = () => new Request("http://localhost/api/cron/synthetic");
const mutableEnv = env as unknown as { BILLING_ENABLED: boolean };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorize.mockReturnValue(null);
  mocks.configured.mockReturnValue(true);
  mutableEnv.BILLING_ENABLED = true;
  mocks.run.mockImplementation(
    async ({ task }: { task: () => Promise<unknown> }) => ({
      skipped: false,
      result: await task(),
    }),
  );
  mocks.list.mockResolvedValue({ data: [], has_more: false });
  mocks.audit.mockReturnValue({
    mismatches: 0,
    missingRemote: 0,
    missingLocal: 0,
    ambiguousRemote: 0,
  });
  mocks.sync.mockResolvedValue({});
  mocks.remind.mockResolvedValue(undefined);
  vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);
  vi.mocked(prisma.billingEvent.findMany).mockResolvedValue([]);
});
it.each([revenuecat, stripe])(
  "rejects unauthorized recovery before provider access",
  async (handler) => {
    mocks.authorize.mockReturnValue(Response.json({}, { status: 401 }));
    expect((await handler(request())).status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  },
);
it.each([revenuecat, stripe])(
  "does not run a disabled provider",
  async (handler) => {
    mutableEnv.BILLING_ENABLED = false;
    mocks.configured.mockReturnValue(false);
    expect(await (await handler(request())).json()).toMatchObject({
      disabled: true,
    });
    expect(mocks.run).not.toHaveBeenCalled();
  },
);
it.each([revenuecat, stripe])(
  "respects an existing operational lease",
  async (handler) => {
    mocks.run.mockResolvedValue({ skipped: true });
    expect(await (await handler(request())).json()).toMatchObject({
      skipped: true,
    });
    expect(mocks.sync).not.toHaveBeenCalled();
  },
);
it("recovers valid customers and durably reports failed reconciliation", async () => {
  vi.mocked(prisma.billingEvent.findMany).mockResolvedValue([
    { id: "a", userId: "user-a", eventType: "RENEWAL" },
    { id: "b", userId: null },
  ] as never);
  expect(await (await revenuecat(request())).json()).toMatchObject({
    processed: 1,
    examined: 2,
  });
  expect(prisma.billingEvent.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ take: 20 }),
  );
  mocks.sync.mockRejectedValue(new Error("private provider details"));
  await expect(revenuecat(request())).rejects.toThrow("recovery_failed");
  expect(prisma.billingEvent.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: { status: "failed", errorCode: "safe_error" },
    }),
  );
});
it("follows Stripe pagination and fails when remote/local data diverge", async () => {
  mocks.list
    .mockResolvedValueOnce({ data: [{ id: "sub-1" }], has_more: true })
    .mockResolvedValueOnce({ data: [{ id: "sub-2" }], has_more: false });
  expect((await stripe(request())).status).toBe(200);
  expect(mocks.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ starting_after: "sub-1" }),
  );
  expect(mocks.audit).toHaveBeenCalledWith({
    local: [],
    remote: [{ id: "sub-1" }, { id: "sub-2" }],
  });
  mocks.audit.mockReturnValue({
    mismatches: 1,
    missingRemote: 0,
    missingLocal: 0,
    ambiguousRemote: 0,
  });
  await expect(stripe(request())).rejects.toThrow("reconciliation_mismatch");
  mocks.list.mockResolvedValue({ data: [], has_more: true });
  await expect(stripe(request())).rejects.toThrow("pagination_failed");
});
it("reminders report successful and failed deliveries separately for both civil windows", async () => {
  vi.mocked(prisma.subscription.findMany).mockResolvedValue([
    { id: "a" },
    { id: "b" },
  ] as never);
  mocks.remind
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("delivery failed"))
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("delivery failed"));
  const response = await reminders(request(), { params: Promise.resolve({}) });
  expect(await response.json()).toMatchObject({
    sent3Days: 1,
    sent1Day: 1,
    trialsChecked3Days: 2,
    trialsChecked1Day: 2,
  });
  mocks.run.mockResolvedValue({ skipped: true });
  expect(
    await (await reminders(request(), { params: Promise.resolve({}) })).json(),
  ).toMatchObject({ skipped: true });
  mocks.authorize.mockReturnValue(Response.json({}, { status: 401 }));
  expect(
    (await reminders(request(), { params: Promise.resolve({}) })).status,
  ).toBe(401);
});

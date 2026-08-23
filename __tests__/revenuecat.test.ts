import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const afterResponse = vi.hoisted(() => ({
  callbacks: [] as (() => void | Promise<void>)[],
}));
vi.mock("@/lib/operations/after-response", () => ({
  scheduleAfterResponse: (callback: () => void | Promise<void>) => {
    afterResponse.callbacks.push(callback);
  },
}));
vi.mock("@/lib/billing/revenuecat", () => ({
  syncRevenueCatCustomer: vi.fn(),
  getSafeRevenueCatErrorCode: vi.fn(() => "revenuecat_handler_failed"),
}));

import { syncRevenueCatCustomer } from "@/lib/billing/revenuecat";
import {
  getRevenueCatCandidateUserIds,
  verifyRevenueCatSignature,
} from "@/lib/billing/revenuecat-webhook";
import { POST as routePost } from "../app/api/webhooks/revenuecat/route";

const mutableEnv = env as unknown as {
  MAINTENANCE_MODE: boolean;
  REVENUECAT_WEBHOOK_AUTH_TOKEN?: string;
  REVENUECAT_WEBHOOK_SIGNING_SECRET?: string;
  REVENUECAT_ALLOWED_APP_IDS?: string;
  REVENUECAT_WEBHOOK_ENVIRONMENTS: string;
};

const eventBody = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    api_version: "1.0",
    event: {
      id: "rc-event-1",
      type: "INITIAL_PURCHASE",
      event_timestamp_ms: Date.now(),
      app_id: "app-ios",
      app_user_id: "user-1",
      original_app_user_id: "user-1",
      aliases: ["$RCAnonymousID:ignored", "user-1"],
      environment: "SANDBOX",
      store: "APP_STORE",
      ...overrides,
    },
  });

const signedRequest = (
  body: string,
  options?: { auth?: string; signature?: string },
) => {
  const signingSecret = mutableEnv.REVENUECAT_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) throw new Error("missing_test_signing_secret");
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature =
    options?.signature ??
    createHmac("sha256", signingSecret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
  return new NextRequest("https://moodday.invalid/api/webhooks/revenuecat", {
    method: "POST",
    body,
    headers: {
      authorization: options?.auth ?? "Bearer revenuecat-auth-token-for-tests",
      "x-revenuecat-webhook-signature": `t=${timestamp},v1=${signature}`,
    },
  });
};

const POST = async (request: NextRequest) => {
  const response = await routePost(request);
  const callbacks = afterResponse.callbacks.splice(0);
  await Promise.all(callbacks.map(async (callback) => callback()));
  return response;
};

describe("RevenueCat webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    afterResponse.callbacks.length = 0;
    mutableEnv.MAINTENANCE_MODE = false;
    mutableEnv.REVENUECAT_WEBHOOK_AUTH_TOKEN =
      "revenuecat-auth-token-for-tests";
    mutableEnv.REVENUECAT_WEBHOOK_SIGNING_SECRET =
      "revenuecat-signing-secret-for-tests";
    mutableEnv.REVENUECAT_ALLOWED_APP_IDS = "app-ios,app-android";
    mutableEnv.REVENUECAT_WEBHOOK_ENVIRONMENTS = "SANDBOX";
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "user-1" },
    ] as never);
    vi.mocked(prisma.billingEvent.create).mockResolvedValue({
      id: "billing-1",
    } as never);
    vi.mocked(prisma.billingEvent.update).mockResolvedValue({} as never);
    vi.mocked(prisma.billingEvent.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.billingEvent.findUniqueOrThrow).mockResolvedValue({
      id: "billing-retry",
    } as never);
    vi.mocked(syncRevenueCatCustomer).mockResolvedValue({} as never);
  });

  it("verifies the raw body HMAC and rejects altered content", () => {
    const body = eventBody();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signingSecret = mutableEnv.REVENUECAT_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) throw new Error("missing_test_signing_secret");
    const signature = createHmac("sha256", signingSecret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    expect(
      verifyRevenueCatSignature({
        header: `t=${timestamp},v1=${signature}`,
        rawBody: body,
      }),
    ).toBe(true);
    expect(
      verifyRevenueCatSignature({
        header: `t=${timestamp},v1=${signature}`,
        rawBody: `${body} `,
      }),
    ).toBe(false);
  });

  it("uses only non-anonymous user identifiers", () => {
    expect(
      getRevenueCatCandidateUserIds({
        id: "event",
        type: "TRANSFER",
        event_timestamp_ms: Date.now(),
        app_user_id: "$RCAnonymousID:one",
        original_app_user_id: "user-1",
        aliases: ["user-1", "$RCAnonymousID:two"],
        transferred_to: ["user-2"],
      }),
    ).toEqual(["user-1", "user-2"]);
  });

  it("fails closed for missing authorization, invalid signatures and wrong apps", async () => {
    const body = eventBody();
    expect((await POST(signedRequest(body, { auth: "wrong" }))).status).toBe(
      401,
    );
    expect(
      (await POST(signedRequest(body, { signature: "0".repeat(64) }))).status,
    ).toBe(401);

    const response = await POST(
      signedRequest(eventBody({ app_id: "other-app" })),
    );
    expect(await response.json()).toEqual({ ok: true, ignored: true });
    expect(prisma.billingEvent.create).not.toHaveBeenCalled();
  });

  it("durably claims and acknowledges before subscriber reconciliation", async () => {
    const response = await routePost(signedRequest(eventBody()));

    expect(await response.json()).toEqual({ ok: true, queued: true });
    expect(prisma.billingEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        provider: "app_store",
        externalEventId: "rc-event-1",
      }),
    });
    expect(syncRevenueCatCustomer).not.toHaveBeenCalled();

    await afterResponse.callbacks.shift()?.();
    expect(syncRevenueCatCustomer).toHaveBeenCalledWith("user-1");
    expect(prisma.billingEvent.update).toHaveBeenLastCalledWith({
      where: { id: "billing-1" },
      data: expect.objectContaining({ status: "processed" }),
    });
  });

  it("deduplicates completed delivery and reclaims a failed delivery", async () => {
    vi.mocked(prisma.billingEvent.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    expect(await (await POST(signedRequest(eventBody()))).json()).toEqual({
      ok: true,
      duplicate: true,
    });

    vi.mocked(prisma.billingEvent.updateMany).mockResolvedValue({ count: 1 });
    expect((await POST(signedRequest(eventBody()))).status).toBe(200);
    expect(syncRevenueCatCustomer).toHaveBeenCalledWith("user-1");
  });
});

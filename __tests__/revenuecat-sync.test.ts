import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  RevenueCatSubscriberError,
  syncRevenueCatCustomer,
} from "@/lib/billing/revenuecat";

const mutableEnv = env as unknown as {
  REVENUECAT_SECRET_API_KEY?: string;
  REVENUECAT_ENTITLEMENT_ID: string;
  REVENUECAT_PLUS_PRODUCT_IDS?: string;
};

describe("RevenueCat customer reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableEnv.REVENUECAT_SECRET_API_KEY = "secret-api-key-for-tests";
    mutableEnv.REVENUECAT_ENTITLEMENT_ID = "plus";
    mutableEnv.REVENUECAT_PLUS_PRODUCT_IDS = "ios_monthly,android_yearly";
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
    } as never);
    vi.mocked(prisma.subscriptionSource.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.subscriptionSource.updateMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(prisma.subscriptionSource.findMany).mockResolvedValue([
      {
        provider: "app_store",
        status: "active",
        currentPeriodEndsAt: new Date("2026-10-01T00:00:00.000Z"),
      },
      {
        provider: "play_store",
        status: "grace",
        currentPeriodEndsAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.entitlementSnapshot.create).mockResolvedValue({} as never);
    vi.mocked(prisma.subscription.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (input: unknown) => {
        if (typeof input === "function") {
          return input(prisma);
        }
        return Promise.all(input as Promise<unknown>[]);
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          subscriber: {
            entitlements: {
              plus: {
                expires_date: "2026-10-01T00:00:00.000Z",
                grace_period_expires_date: null,
                product_identifier: "ios_monthly",
              },
            },
            subscriptions: {
              ios_monthly: {
                auto_resume_date: null,
                expires_date: "2026-10-01T00:00:00.000Z",
                grace_period_expires_date: null,
                period_type: "NORMAL",
                refunded_at: null,
                store: "app_store",
              },
              android_yearly: {
                auto_resume_date: null,
                expires_date: "2026-08-20T00:00:00.000Z",
                grace_period_expires_date: "2026-09-01T00:00:00.000Z",
                period_type: "NORMAL",
                refunded_at: null,
                store: "play_store",
              },
              unrelated: {
                expires_date: null,
                store: "app_store",
              },
            },
          },
        }),
      ),
    );
  });

  it("maps store states, expires missing sources and projects one shared right", async () => {
    const entitlement = await syncRevenueCatCustomer(
      "user-1",
      new Date("2026-08-23T00:00:00.000Z"),
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://api.revenuecat.com/v1/subscribers/user-1",
      expect.objectContaining({
        headers: { Authorization: "Bearer secret-api-key-for-tests" },
        cache: "no-store",
      }),
    );
    expect(prisma.subscriptionSource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: "app_store",
          productId: "ios_monthly",
          status: "active",
        }),
      }),
    );
    expect(prisma.subscriptionSource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: "play_store",
          productId: "android_yearly",
          status: "grace",
        }),
      }),
    );
    expect(prisma.subscriptionSource.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user-1",
        externalSubscriptionId: {
          notIn: expect.arrayContaining([
            "app_store:user-1:ios_monthly",
            "play_store:user-1:android_yearly",
          ]),
        },
      }),
      data: { status: "expired", lastVerifiedAt: expect.any(Date) },
    });
    expect(entitlement).toEqual(
      expect.objectContaining({
        active: true,
        sourceProviders: ["app_store", "play_store"],
        duplicateSubscription: true,
        manageWith: null,
      }),
    );
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ plan: "plus", status: "active" }),
      }),
    );
  });

  it("does not create a RevenueCat customer for an unknown local user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(syncRevenueCatCustomer("unknown")).rejects.toBeInstanceOf(
      RevenueCatSubscriberError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

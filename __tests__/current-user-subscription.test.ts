import { beforeEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequiredCurrentUser } from "@/lib/user/get-user";
import {
  getUserActiveSubscription,
  checkUserSubscription,
} from "@/lib/user/get-user-subscription";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  entitlement: vi.fn(),
  effective: vi.fn(),
}));
vi.mock("@/lib/auth/auth-user", () => ({ getSession: mocks.session }));
vi.mock("@/features/couple/entitlement.service", () => ({
  getDuoEntitlement: mocks.entitlement,
}));
vi.mock("@/lib/billing/entitlements", () => ({
  getEffectivePlan: mocks.effective,
}));
vi.mock("next/navigation", () => ({
  unauthorized: () => {
    throw new Error("unauthorized");
  },
}));
const subscription = {
  id: "subscription",
  plan: "plus",
  status: "active",
  periodStart: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  graceEndsAt: null,
};
const user = {
  id: "owner",
  name: "Synthetic",
  email: "owner@example.invalid",
  image: null,
  subscription,
  stripeCustomerId: "cus_fixture",
  password: "must-not-leak",
  secret: "must-not-leak",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  vi.mocked(prisma.user.findFirst).mockResolvedValue(user as never);
  mocks.entitlement.mockResolvedValue({ active: false });
  mocks.effective.mockReturnValue("free");
});
it("returns only the public profile and queries the authenticated owner", async () => {
  expect(await getRequiredCurrentUser()).toEqual({
    id: "owner",
    name: "Synthetic",
    email: "owner@example.invalid",
    image: null,
    subscription,
    stripeCustomerId: "cus_fixture",
  });
  expect(prisma.user.findFirst).toHaveBeenCalledWith({
    where: { id: "owner" },
    include: { subscription: true },
  });
});
it("handles absent, deleted and unsubscribed identities without leaking a profile", async () => {
  mocks.session.mockResolvedValue(null);
  expect(await getCurrentUser()).toBeNull();
  await expect(getRequiredCurrentUser()).rejects.toThrow("unauthorized");
  expect(await getUserActiveSubscription()).toBeNull();
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
  expect(await getCurrentUser()).toBeNull();
  vi.mocked(prisma.user.findFirst).mockResolvedValue({
    ...user,
    subscription: null,
  } as never);
  expect(await getCurrentUser()).toMatchObject({ subscription: null });
  expect(await getUserActiveSubscription()).toBeNull();
  expect(await checkUserSubscription(null)).toBe(false);
});
it("retains valid legacy Plus and reconciles active native entitlements", async () => {
  expect(await getUserActiveSubscription()).toBeNull();
  mocks.effective.mockReturnValue("plus");
  expect(await getUserActiveSubscription()).toMatchObject({
    sourceProviders: ["stripe"],
    manageWith: "stripe",
    duplicateSubscription: false,
  });
  expect(await checkUserSubscription(user)).toBe(true);
  mocks.entitlement.mockResolvedValue({
    active: true,
    sourceProviders: ["app_store"],
    duplicateSubscription: true,
    manageWith: "app_store",
  });
  expect(await getUserActiveSubscription()).toMatchObject({
    sourceProviders: ["app_store"],
    manageWith: "app_store",
    duplicateSubscription: true,
  });
});

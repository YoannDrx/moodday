import { beforeEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
vi.mock("server-only", () => ({}));
import {
  authRateLimitStorage,
  consumeAuthRateLimit,
} from "@/lib/auth/rate-limit-storage";

beforeEach(() => vi.clearAllMocks());
it("admits through a single parameterized atomic statement", async () => {
  vi.mocked(prisma.$queryRaw).mockResolvedValue([
    { count: 1, lastRequest: BigInt(1000) },
  ]);
  await expect(
    consumeAuthRateLimit("synthetic", { window: 60, max: 5 }, 1000),
  ).resolves.toEqual({ allowed: true, retryAfter: null });
  expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(authRateLimitStorage.consume).toBe(consumeAuthRateLimit);
});
it("returns a bounded retry delay after refusal", async () => {
  vi.mocked(prisma.$queryRaw).mockResolvedValue([
    { count: 6, lastRequest: BigInt(1000) },
  ]);
  await expect(
    consumeAuthRateLimit("synthetic", { window: 60, max: 5 }, 1500),
  ).resolves.toEqual({ allowed: false, retryAfter: 60 });
});
it("fails closed for missing storage or a provider error", async () => {
  vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
  await expect(
    consumeAuthRateLimit("synthetic", { window: 60, max: 5 }),
  ).rejects.toThrow("unavailable");
  vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("database offline"));
  await expect(
    consumeAuthRateLimit("synthetic", { window: 60, max: 5 }),
  ).rejects.toThrow("database offline");
});
it("rejects invalid rules without touching storage", async () => {
  await expect(
    consumeAuthRateLimit("synthetic", { window: 60, max: 0 }),
  ).rejects.toThrow("Invalid");
  expect(prisma.$queryRaw).not.toHaveBeenCalled();
});

import { expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  enforceMutationBudget,
  isBodyWithinBudget,
  MutationRateLimitError,
} from "@/lib/api-v2/mutation-budget";
it("returns a bounded retry delay and does not expose the account in the key", async () => {
  vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: 601 }]);
  await expect(
    enforceMutationBudget("private-user", 90_000),
  ).rejects.toMatchObject({ status: 429, retryAfter: 30 });
  expect(String(vi.mocked(prisma.$queryRaw).mock.calls.at(-1))).not.toContain(
    "private-user",
  );
  vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: 1 }]);
  await expect(enforceMutationBudget("private-user")).resolves.toBeUndefined();
  expect(new MutationRateLimitError(5).status).toBe(429);
});
it("checks actual body size even without Content-Length and leaves valid requests readable", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: "small",
  });
  expect(await isBodyWithinBudget(request, 8)).toBe(true);
  expect(await request.text()).toBe("small");
  expect(
    await isBodyWithinBudget(
      new Request("https://example.test", {
        method: "POST",
        body: "too large",
      }),
      3,
    ),
  ).toBe(false);
  expect(await isBodyWithinBudget(new Request("https://example.test"))).toBe(
    true,
  );
});

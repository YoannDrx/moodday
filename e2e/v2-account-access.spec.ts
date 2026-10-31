import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test("a session can accept current consent before health access, without duplicates or revoked-consent replay", async ({
  page,
}) => {
  const account = await createTestAccount({ page, callbackURL: "/today" });
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: account.email },
    select: { id: true },
  });
  // Only this synthetic account is changed. This models a first OAuth session.
  await prisma.userConsent.deleteMany({ where: { userId: user.id } });
  const read = await page.request.get("/api/v2/account-access");
  expect(read.status()).toBe(200);
  expect(read.headers()["cache-control"]).toContain("no-store");
  const { data: access } = await read.json();
  expect(access).toMatchObject({
    emailVerified: true,
    consentsAccepted: false,
  });
  const today = "/api/v2/today?localDate=2026-09-06&timezone=Europe%2FParis";
  expect((await page.request.get(today)).status()).toBe(401);
  const input = {
    age18Accepted: true,
    termsAccepted: true,
    privacyAccepted: true,
    healthDataConsentAccepted: true,
    locale: "fr",
    versions: access.versions,
  };
  expect(
    (
      await page.request.post("/api/v2/account-access", {
        data: { ...input, healthDataConsentAccepted: false },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post("/api/v2/account-access", { data: input })
    ).status(),
  ).toBe(200);
  const beforeReplay = await prisma.userConsent.findMany({
    where: { userId: user.id },
    orderBy: { purpose: "asc" },
  });
  expect(beforeReplay).toHaveLength(4);
  expect((await page.request.get(today)).status()).toBe(200);
  expect(
    (
      await page.request.post("/api/v2/account-access", { data: input })
    ).status(),
  ).toBe(200);
  expect(
    await prisma.userConsent.findMany({
      where: { userId: user.id },
      orderBy: { purpose: "asc" },
    }),
  ).toEqual(beforeReplay);
  await prisma.userConsent.updateMany({
    where: { userId: user.id, purpose: "health_data" },
    data: { revokedAt: new Date() },
  });
  expect(
    (
      await page.request.post("/api/v2/account-access", { data: input })
    ).status(),
  ).toBe(403);
  expect((await page.request.get(today)).status()).toBe(401);
});

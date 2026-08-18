import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { expect, test } from "@playwright/test";
import { createEmailVerificationToken } from "better-auth/api";
import { createTestAccount } from "./utils/auth-test";

test("sign up requires verification before the account can be used", async ({
  page,
}) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
    verifyEmail: false,
  });

  const unverifiedUser = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
  });
  expect(unverifiedUser.emailVerified).toBe(false);
  const signupConsents = await prisma.userConsent.findMany({
    where: { userId: unverifiedUser.id },
    select: {
      purpose: true,
      version: true,
      country: true,
      source: true,
      revokedAt: true,
    },
  });
  expect(signupConsents.map(({ purpose }) => purpose).sort()).toEqual([
    "age_18",
    "health_data",
    "privacy",
    "terms",
  ]);
  for (const consent of signupConsents) {
    expect(consent).toMatchObject({
      country: "FR",
      source: "signup",
      revokedAt: null,
    });
    expect(consent.version).not.toHaveLength(0);
  }

  await page.goto("/auth/signin?callbackUrl=/dashboard");
  await page.getByLabel(/^Email$/i).fill(userData.email);
  await page.locator('input[name="password"]').fill(userData.password);
  const signInResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/auth/sign-in/email"),
  );
  await page
    .getByRole("button", { name: /sign in|se connecter/i })
    .first()
    .click();
  const blockedSignIn = await signInResponsePromise;
  expect(blockedSignIn.ok()).toBe(false);

  await page.goto("/dashboard");
  await expect(page.getByText("401")).toBeVisible();

  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (!authSecret) throw new Error("BETTER_AUTH_SECRET is required for E2E");
  const token = await createEmailVerificationToken(
    authSecret,
    userData.email,
    undefined,
    60 * 60,
  );
  const verificationUrl = `${getServerUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent("/dashboard")}`;
  await page.goto(verificationUrl);
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

  const verifiedUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });
  expect(verifiedUser).toMatchObject({
    name: userData.name,
    email: userData.email,
    emailVerified: true,
  });

  const replay = await page.request.get(verificationUrl, {
    maxRedirects: 0,
  });
  expect(replay.status()).toBe(400);

  // Clean up - delete the test user
  if (verifiedUser) {
    await prisma.user.delete({
      where: { id: verifiedUser.id },
    });
  }
});

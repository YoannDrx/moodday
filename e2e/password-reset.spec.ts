import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test("password reset flow", async ({ page }) => {
  // 1. Create a test account
  const userData = await createTestAccount({
    page,
    callbackURL: "/account",
  });

  // Wait to be on the account page
  // Wait 2 seconds to ensure everything is loaded

  await page.waitForURL(/\/account/, { timeout: 10000 });

  // 2. Sign out (redirects to "/" after signout, not "/auth/signin")

  await page.getByRole("button", { name: /sign out|déconnexion/i }).click();
  // After sign out, user is redirected to home page "/"
  await page.waitForURL("/", { timeout: 10000 });

  // 3. Go to forget password page
  await page.goto(`${getServerUrl()}/auth/forget-password`);

  // 4. Submit the email for password reset
  await page.getByLabel("Email").fill(userData.email);
  // i18n: button text is "Send reset link" or "Envoyer le lien"
  await page
    .getByRole("button", { name: /send reset link|Envoyer le lien/i })
    .click();

  // 5. Should be redirected to verify page
  await page.waitForURL(/\/auth\/verify/, { timeout: 10000 });

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: {
        contains: "reset-password",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const token = verification?.identifier.replace("reset-password:", "");

  expect(token).not.toBeNull();

  // 7. Navigate to the reset password page with the token
  const resetToken = token;
  await page.goto(`${getServerUrl()}/auth/reset-password?token=${resetToken}`);

  // 8. Set a new password
  const newPassword = faker.internet.password({ length: 12, memorable: true });
  await page.locator('input[name="password"]').fill(newPassword);
  // i18n: button text is "Update password" or "Mettre à jour"
  await page
    .getByRole("button", { name: /Update password|Mettre à jour/i })
    .click();

  // 9. Should be redirected to sign in page
  await page.waitForURL(/\/auth\/signin/, { timeout: 30000 });

  // 10. Try to sign in with the new password
  await page.getByLabel("Email").fill(userData.email);
  await page.locator('input[name="password"]').fill(newPassword);
  // i18n: button text is "Sign in" or "Se connecter"
  await page
    .getByRole("button", { name: /sign in|Se connecter/i })
    .first()
    .click();

  // 11. Should be redirected to the app page
  await page.waitForURL(/\/app/, { timeout: 10000 });

  // Clean up - delete the test user
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (user) {
    await prisma.user.delete({
      where: { id: user.id },
    });
  }
});

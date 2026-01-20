import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test("sign up and verify account creation", async ({ page }) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/app",
  });

  await page.waitForURL("/app");

  // Verify we're on the app page
  expect(page.url()).toContain("/app");

  // Verify the user was created in the database
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  // Verify user exists
  expect(user).not.toBeNull();
  expect(user?.name).toBe(userData.name);
  expect(user?.email).toBe(userData.email);
  expect(user?.emailVerified).toBe(false); // Email should not be verified yet

  // Clean up - delete the test user
  if (user) {
    await prisma.user.delete({
      where: { id: user.id },
    });
  }
});

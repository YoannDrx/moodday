import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { retry } from "./retry";

export const getUserEmail = () =>
  `playwright-test-${faker.internet.email().toLowerCase()}`;

const waitForCallbackUrl = async (page: Page, callbackURL: string) => {
  const expected = new URL(callbackURL, page.url());
  await page.waitForURL(
    (url) =>
      url.pathname === expected.pathname && url.search === expected.search,
    { timeout: 30000 },
  );
  await page.waitForLoadState("networkidle");
};

/**
 * Helper function to create a test account
 * @returns Object containing the test user's credentials
 */
export async function createTestAccount(options: {
  page: Page;
  callbackURL?: string;
  initialUserData?: { name: string; email: string; password: string };
  admin?: boolean;
}) {
  // Generate fake user data
  const userData = options.initialUserData ?? {
    name: faker.person.fullName(),
    email: getUserEmail(),
    password: faker.internet.password({ length: 12, memorable: true }),
  };

  // Navigate to signup page
  await options.page.goto(`/auth/signup?callbackUrl=${options.callbackURL}`);

  // Fill out the form (supports both English and French labels)
  await options.page.getByLabel(/^Name$|^Nom$/i).fill(userData.name);
  await options.page.getByLabel(/^Email$/i).fill(userData.email);
  await options.page.locator('input[name="password"]').fill(userData.password);
  await options.page
    .locator('input[name="verifyPassword"]')
    .fill(userData.password);

  // Submit the form (supports both English "Create account" and French "Créer un compte")
  await options.page
    .getByRole("button", { name: /create account|créer un compte/i })
    .click();

  // Wait for navigation to complete - we should be redirected to the callback URL
  if (options.callbackURL) {
    await waitForCallbackUrl(options.page, options.callbackURL);
  }

  if (options.admin) {
    const user = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: userData.email },
        }),
      {
        maxAttempts: 5,
        delayMs: 1000,
        backoff: true,
      },
    );
    logger.info("Creating admin user", user);
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    });
    // Wait for the database update to be committed
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return userData;
}

/**
 * Helper function to sign in with an existing account
 * @returns Object containing the user's credentials
 */
export async function signInAccount(options: {
  page: Page;
  userData: { email: string; password: string };
  callbackURL?: string;
}) {
  const { page, userData, callbackURL } = options;

  // Navigate to signin page
  await page.goto(
    `/auth/signin${callbackURL ? `?callbackUrl=${callbackURL}` : ""}`,
  );
  await page.waitForLoadState("networkidle");

  // Fill out the form (supports both English and French labels)
  await page.getByLabel(/^Email$/i).fill(userData.email);
  await page.locator('input[name="password"]').fill(userData.password);

  // Submit the form (supports both English "Sign in" and French "Se connecter")
  await page
    .getByRole("button", { name: /sign in|se connecter/i })
    .first()
    .click();

  // Wait for navigation to complete if a callback URL is provided
  if (callbackURL) {
    await waitForCallbackUrl(page, callbackURL);
  }

  return userData;
}

/**
 * Helper function to sign out the current user
 * @param page - Playwright page object
 */
export async function signOutAccount(options: { page: Page }) {
  const { page } = options;

  // Navigate to dashboard page
  await page.goto(`/dashboard`);
  await page.waitForLoadState("networkidle");

  // Open the user menu dropdown
  const userMenuButton = page.getByTestId("user-menu-button");
  await userMenuButton.waitFor({ state: "visible", timeout: 10000 });
  await userMenuButton.click();

  // Click logout in the dropdown
  const logoutMenuItem = page.getByTestId("dropdown-logout");
  await logoutMenuItem.waitFor({ state: "visible", timeout: 5000 });
  await logoutMenuItem.click();

  // After sign out, user is redirected to home page "/" (not /auth/signin)
  await page.waitForURL("/", { timeout: 10000 });
}

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";
import { retry } from "./retry";

export type E2ERole = "cycle_owner" | "supporter";

/**
 * Completes the couple onboarding through the API, so feature scenarios start
 * on an usable "Aujourd'hui" screen. Dedicated specs exercise the UI flow.
 */
export async function completeOnboardingViaApi(
  page: Page,
  role: E2ERole = "cycle_owner",
  options: { origin?: string; displayName?: string } = {},
) {
  const displayName =
    options.displayName ?? (role === "cycle_owner" ? "Léa" : "Tom");
  const headers = { Origin: options.origin ?? new URL(page.url()).origin };
  const chosen = await page.request.post("/api/v2/role", {
    headers,
    data: { role },
  });
  expect(chosen.ok()).toBe(true);
  const completed =
    role === "cycle_owner"
      ? await page.request.post("/api/v2/onboarding/owner", {
          headers,
          data: {
            displayName,
            lastPeriodStart: null,
            typicalCycleLength: 28,
            typicalPeriodLength: 5,
            hardestThings: [],
            usualNeeds: ["calm"],
          },
        })
      : await page.request.post("/api/v2/onboarding/supporter", {
          headers,
          data: { displayName, supporterFocus: ["help"] },
        });
  expect(completed.ok()).toBe(true);
}

export const getUserEmail = () =>
  `playwright-test-${faker.string.uuid()}@example.test`;

/** API setup for feature scenarios; dedicated auth specs retain the full UI flow. */
export async function createTestAccountViaApi({
  page,
  baseURL,
  role = "cycle_owner",
}: {
  page: Page;
  baseURL?: string;
  /** Pass null to keep the account before onboarding. */
  role?: E2ERole | null;
}) {
  if (!baseURL || process.env.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED !== "true")
    throw new Error("An isolated Playwright environment is required");
  const userData = {
    name: "Synthetic feature scenario",
    email: `playwright-test-${crypto.randomUUID()}@example.test`,
    password: `Moodday-fixture-${crypto.randomUUID()}!`,
  };
  const headers = { Origin: new URL(baseURL).origin };
  const created = await page.request.post("/api/auth/sign-up/email", {
    headers,
    data: userData,
  });
  expect(created.ok()).toBe(true);
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
  });
  expect(user.emailVerified).toBe(false);
  // Same synthetic verification transition as createTestAccount; no email leaves.
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
  const signedIn = await page.request.post("/api/auth/sign-in/email", {
    headers,
    data: { email: userData.email, password: userData.password },
  });
  expect(signedIn.ok()).toBe(true);
  const access = await page.request.get("/api/v2/account-access");
  expect(access.status()).toBe(200);
  const { data } = await access.json();
  const consent = await page.request.post("/api/v2/account-access", {
    headers,
    data: {
      age18Accepted: true,
      termsAccepted: true,
      privacyAccepted: true,
      healthDataConsentAccepted: true,
      locale: "fr",
      versions: data.versions,
    },
  });
  expect(consent.status()).toBe(200);
  if (role) {
    await completeOnboardingViaApi(page, role, {
      origin: new URL(baseURL).origin,
    });
  }
  return userData;
}

const waitForCallbackUrl = async (page: Page, callbackURL: string) => {
  const expected = new URL(callbackURL, page.url());
  const canonicalPath =
    expected.pathname === "/app"
      ? "/today"
      : expected.pathname === "/settings" &&
          expected.searchParams.get("tab") === "profile"
        ? "/settings/profile"
        : null;

  await page.waitForURL(
    (url) =>
      (url.pathname === expected.pathname && url.search === expected.search) ||
      url.pathname === canonicalPath ||
      url.pathname === "/onboarding",
    { timeout: 30000 },
  );
  // New accounts first choose their side of the duo. Feature scenarios take
  // the cycle owner path, then continue to the page they asked for.
  if (
    new URL(page.url()).pathname === "/onboarding" &&
    expected.pathname !== "/onboarding"
  ) {
    await completeOnboardingViaApi(page);
    await page.goto(callbackURL, { waitUntil: "domcontentloaded" });
  }
  // Authenticated pages synchronize and prefetch in the background. A global
  // network-idle condition can time out on a fully usable dashboard. Wait for
  // the navigation document; each scenario asserts its own visible controls.
  await page.waitForLoadState("domcontentloaded");
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
  verifyEmail?: boolean;
}) {
  const browserErrors: string[] = [];
  options.page.on("pageerror", (error) => browserErrors.push(error.message));
  options.page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  // Generate fake user data
  const userData = options.initialUserData ?? {
    name: faker.person.fullName(),
    email: getUserEmail(),
    password: faker.internet.password({ length: 12, memorable: true }),
  };

  // Navigate to signup page
  await options.page.goto(`/auth/signup?callbackUrl=${options.callbackURL}`, {
    waitUntil: "domcontentloaded",
  });

  // Fill out the form (supports both English and French labels)
  await options.page.getByLabel(/^Name$|^Nom$/i).fill(userData.name);
  await options.page.getByLabel(/^Email$/i).fill(userData.email);
  await options.page.locator('input[name="password"]').fill(userData.password);
  await options.page
    .locator('input[name="verifyPassword"]')
    .fill(userData.password);
  const requiredConsents = options.page.getByRole("checkbox");
  for (let index = 0; index < 4; index += 1) {
    const consent = requiredConsents.nth(index);
    // Consent controls are intentionally exercised in document order.
    // eslint-disable-next-line no-await-in-loop
    await consent.check();
    // eslint-disable-next-line no-await-in-loop
    await expect(consent).toBeChecked();
  }

  // Submit the form (supports both English "Create account" and French "Créer un compte")
  await options.page.evaluate(() => {
    document.querySelector("form")?.addEventListener(
      "submit",
      () => {
        document.documentElement.dataset.e2eSubmitObserved = "true";
      },
      { once: true },
    );
  });
  const signUpResponsePromise = options.page.waitForResponse(
    (response) => response.url().includes("/api/auth/sign-up/email"),
    { timeout: 15000 },
  );
  await options.page
    .getByRole("button", { name: /create account|créer un compte/i })
    .click();
  const signUpResponse = await signUpResponsePromise.catch(async (error) => {
    const diagnostic = await options.page.evaluate(() => ({
      formValid: document.querySelector("form")?.checkValidity() ?? false,
      submitObserved:
        document.documentElement.dataset.e2eSubmitObserved === "true",
      fieldsetDisabled:
        document.querySelector("fieldset")?.hasAttribute("disabled") ?? false,
      messages: Array.from(
        document.querySelectorAll('[data-slot="form-message"]'),
      ).map((element) => element.textContent.trim()),
    }));
    throw new Error(
      `${error instanceof Error ? error.message : "Sign-up request missing"}; diagnostic=${JSON.stringify({ ...diagnostic, browserErrors: browserErrors.map((message) => message.slice(0, 300)) })}`,
    );
  });
  if (!signUpResponse.ok()) {
    throw new Error(`Sign-up failed with HTTP ${signUpResponse.status()}`);
  }

  await options.page.waitForURL(/\/auth\/verify/, { timeout: 30000 });

  // Browser tests do not send email externally. This state transition models
  // the successful, single-use verification link click; dedicated auth tests
  // assert that the account is blocked before this transition.
  const createdUser = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({ where: { email: userData.email } }),
    { maxAttempts: 5, delayMs: 250, backoff: true },
  );
  if (createdUser.emailVerified) {
    throw new Error("New E2E account was unexpectedly pre-verified");
  }
  if (options.verifyEmail === false) return userData;

  await prisma.user.update({
    where: { id: createdUser.id },
    data: {
      emailVerified: true,
      ...(options.admin ? { role: "admin", twoFactorEnabled: true } : {}),
    },
  });
  await signInAccount({
    page: options.page,
    userData,
    callbackURL: options.callbackURL ?? "/today",
  });

  if (options.admin) {
    logger.info("E2E admin account prepared", {
      eventName: "e2e_admin_prepared",
      status: "succeeded",
    });
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
  await page.waitForLoadState("domcontentloaded");

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

  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(async (item) => item.unregister()));
  });
  if (new URL(page.url()).pathname !== "/settings/security") {
    await page.goto("/settings/security");
  }
  await page.waitForLoadState("domcontentloaded");
  await page
    .getByRole("button", { name: /^Sign out$|^Log out$|^Se déconnecter$/i })
    .click({ noWaitAfter: true });

  // A full document replacement can hide the completed fetch event in
  // WebKit. Assert the deterministic signed-out destination instead.
  await page.waitForURL((url) => url.pathname === "/auth/signin", {
    timeout: 30000,
    waitUntil: "commit",
  });
  await page.goto("/today");
  await expect(page.getByText("401")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Sign in|Se connecter/i }),
  ).toBeVisible();
}

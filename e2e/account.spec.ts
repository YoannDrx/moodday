// Account management E2E tests
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";
import { retry } from "./utils/retry";
import { generateTotpFromUri } from "./utils/totp";

test.describe("account", () => {
  test("TOTP enrollment and recovery codes work end to end", async ({
    page,
  }, testInfo) => {
    const authHeaders = {
      origin: getServerUrl(),
      "x-forwarded-for": `192.0.2.${(testInfo.workerIndex % 200) + 1}`,
    };
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings/security",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
      select: { id: true },
    });

    const enrollmentResponse = await page.request.post(
      "/api/auth/two-factor/enable",
      {
        data: { password: userData.password, issuer: "Moodday" },
        headers: authHeaders,
      },
    );
    expect(enrollmentResponse.ok()).toBe(true);
    const enrollment = (await enrollmentResponse.json()) as {
      totpURI: string;
      backupCodes: string[];
    };
    expect(enrollment.backupCodes).toHaveLength(10);
    const recoveryCode = enrollment.backupCodes[0];
    expect(recoveryCode).toBeTruthy();

    const pendingTwoFactor = await prisma.twoFactor.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(pendingTwoFactor.verified).toBe(false);
    expect(pendingTwoFactor.backupCodes).not.toContain(recoveryCode);
    expect(pendingTwoFactor.secret).not.toContain(
      new URL(enrollment.totpURI).searchParams.get("secret") ?? "missing",
    );

    const verificationResponse = await page.request.post(
      "/api/auth/two-factor/verify-totp",
      {
        data: {
          code: generateTotpFromUri(enrollment.totpURI),
          trustDevice: false,
        },
        headers: authHeaders,
      },
    );
    expect(verificationResponse.ok()).toBe(true);
    expect(
      await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { twoFactorEnabled: true },
      }),
    ).toEqual({ twoFactorEnabled: true });

    expect(
      (
        await page.request.post("/api/auth/sign-out", {
          data: {},
          headers: authHeaders,
        })
      ).ok(),
    ).toBe(true);
    const pendingSignIn = await page.request.post("/api/auth/sign-in/email", {
      data: {
        email: userData.email,
        password: userData.password,
        callbackURL: "/dashboard",
      },
      headers: authHeaders,
    });
    expect(pendingSignIn.ok()).toBe(true);
    expect(await pendingSignIn.json()).toMatchObject({
      twoFactorRedirect: true,
    });

    const recoveryResponse = await page.request.post(
      "/api/auth/two-factor/verify-backup-code",
      {
        data: { code: recoveryCode, trustDevice: false },
        headers: authHeaders,
      },
    );
    expect(recoveryResponse.ok()).toBe(true);
    const consumedTwoFactor = await prisma.twoFactor.findFirstOrThrow({
      where: { userId: user.id },
      select: { backupCodes: true },
    });
    expect(consumedTwoFactor.backupCodes).not.toBe(
      pendingTwoFactor.backupCodes,
    );

    const reusedRecoveryCode = await page.request.post(
      "/api/auth/two-factor/verify-backup-code",
      {
        data: { code: recoveryCode, trustDevice: false },
        headers: authHeaders,
      },
    );
    expect([401, 429]).toContain(reusedRecoveryCode.status());

    await prisma.user.delete({ where: { id: user.id } });
  });

  test("an existing account must accept the current legal versions", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
      select: { id: true },
    });
    await prisma.userConsent.deleteMany({ where: { userId: user.id } });

    await page.goto("/dashboard");
    await page.waitForURL((url) => url.pathname === "/auth/consent");
    const requiredConsents = page.getByRole("checkbox");
    await expect(requiredConsents).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      // Consent controls are intentionally exercised in document order.
      // eslint-disable-next-line no-await-in-loop
      await requiredConsents.nth(index).check();
    }
    await page
      .getByRole("button", {
        name: /Accept and continue|Accepter et continuer/i,
      })
      .click();
    await page.waitForURL((url) => url.pathname === "/dashboard");

    const accepted = await prisma.userConsent.findMany({
      where: { userId: user.id, revokedAt: null },
      select: { purpose: true, version: true, source: true },
    });
    expect(accepted.map(({ purpose }) => purpose).sort()).toEqual([
      "age_18",
      "health_data",
      "privacy",
      "terms",
    ]);
    expect(accepted.every(({ version }) => version.length > 0)).toBe(true);
    expect(accepted.every(({ source }) => source === "migration_gate")).toBe(
      true,
    );

    await prisma.user.delete({ where: { id: user.id } });
  });

  test("sensitive auth endpoints require a session less than ten minutes old", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings/security",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
      select: { id: true },
    });

    const freshResponse = await page.request.post(
      "/api/auth/passkey/delete-passkey",
      {
        data: { id: "missing-e2e-passkey" },
        headers: { origin: getServerUrl() },
      },
    );
    expect(freshResponse.status()).not.toBe(401);
    expect(await freshResponse.json()).not.toEqual({
      error: "Recent authentication required",
    });

    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { createdAt: new Date(Date.now() - 11 * 60 * 1000) },
    });

    const staleResponse = await page.request.post(
      "/api/auth/passkey/delete-passkey",
      {
        data: { id: "missing-e2e-passkey" },
        headers: { origin: getServerUrl() },
      },
    );
    expect(staleResponse.status()).toBe(403);
    await expect(staleResponse.json()).resolves.toEqual({
      error: "Recent authentication required",
    });

    await prisma.user.delete({ where: { id: user.id } });
  });

  test("delete account flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings/privacy",
    });
    const user = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: userData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );

    await prisma.$transaction([
      prisma.feedback.create({
        data: { review: 5, message: "Private feedback", userId: user.id },
      }),
      prisma.emailLog.create({
        data: {
          to: userData.email,
          subject: "Private account email",
          template: "e2e-account-delete",
          userId: user.id,
        },
      }),
      prisma.emailLog.create({
        data: {
          to: userData.email,
          subject: "Unlinked private email",
          template: "e2e-account-delete-unlinked",
        },
      }),
      prisma.newsletterSubscriber.upsert({
        where: { email: userData.email },
        create: { email: userData.email, source: "e2e" },
        update: { source: "e2e" },
      }),
      prisma.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: `https://push.example.test/${user.id}`,
          p256dh: "e2e-p256dh",
          auth: "e2e-auth",
        },
      }),
      prisma.moodEntry.create({
        data: { userId: user.id, value: 5, note: "Private mood note" },
      }),
      prisma.notificationDelivery.create({
        data: {
          userId: user.id,
          deliveryKey: "e2e-account-delete",
        },
      }),
    ]);

    await page.waitForURL(/\/settings\/privacy/, { timeout: 10000 });
    await page
      .getByRole("button", { name: /Delete account|Supprimer le compte/i })
      .click();

    // Wait for the confirm dialog to appear (i18n: "Confirm deletion")
    const deleteDialog = page.getByRole("alertdialog");
    await expect(deleteDialog).toBeVisible();

    const confirmInput = deleteDialog.getByRole("textbox");
    // i18n: confirmation text is "Delete account" or "Supprimer le compte"
    await confirmInput.fill("Delete account");

    const deleteButton = deleteDialog.getByRole("button", {
      name: /Delete account|Supprimer le compte/i,
    });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // i18n: toast message is "Deletion requested" or "Suppression demandée"
    await expect(
      page.getByText(/Deletion requested|Suppression demandée/i),
    ).toBeVisible();

    const verification = await prisma.verification.findFirst({
      where: {
        identifier: {
          contains: "delete-account",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const token = verification?.identifier.replace("delete-account-", "");
    expect(token).not.toBeNull();

    const resetToken = token;
    const confirmUrl = `${getServerUrl()}/auth/confirm-delete?token=${resetToken}&callbackUrl=/auth/goodbye`;
    await page.goto(confirmUrl);
    // The deletion request itself is verified here; service-worker behavior is
    // covered by the dedicated offline suite. Unregister it to avoid WebKit's
    // emulated worker lifecycle retaining a superseded script between pages.
    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async (item) => item.unregister()));
    });

    // i18n: button text is "Delete account" (EN) / "Supprimer le compte" (FR)
    const goodbyeNavigation = page.waitForURL(
      (url) => url.pathname === "/auth/goodbye",
      {
        timeout: 30000,
        waitUntil: "commit",
      },
    );
    await page
      .getByRole("button", { name: /Delete account|Supprimer le compte/i })
      .click({ noWaitAfter: true });
    await goodbyeNavigation;
    // i18n: page title is "You're signed out" (EN) / "Vous êtes déconnecté" (FR)
    await expect(
      page.getByText(/You're signed out|Vous êtes déconnecté/i).first(),
    ).toBeVisible();

    const deletedUser = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(deletedUser).toBeNull();
    const [
      feedbackCount,
      emailLogCount,
      newsletterCount,
      pushCount,
      moodCount,
      deliveryCount,
      preferenceCount,
    ] = await Promise.all([
      prisma.feedback.count({ where: { userId: user.id } }),
      prisma.emailLog.count({
        where: { OR: [{ userId: user.id }, { to: userData.email }] },
      }),
      prisma.newsletterSubscriber.count({
        where: { email: userData.email },
      }),
      prisma.pushSubscription.count({ where: { userId: user.id } }),
      prisma.moodEntry.count({ where: { userId: user.id } }),
      prisma.notificationDelivery.count({ where: { userId: user.id } }),
      prisma.userPreferences.count({ where: { userId: user.id } }),
    ]);

    expect({
      feedbackCount,
      emailLogCount,
      newsletterCount,
      pushCount,
      moodCount,
      deliveryCount,
      preferenceCount,
    }).toEqual({
      feedbackCount: 0,
      emailLogCount: 0,
      newsletterCount: 0,
      pushCount: 0,
      moodCount: 0,
      deliveryCount: 0,
      preferenceCount: 0,
    });
  });

  test("update name flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings/profile",
    });
    await page.waitForURL(/\/settings\/profile/, { timeout: 10000 });

    // Wait for the form to be fully loaded and network idle
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    // Wait for the form to be ready
    const input = page.getByRole("textbox", { name: /Full name|Nom complet/i });
    await expect(input).toBeVisible({ timeout: 10000 });

    // Clear the input and fill with new name
    const newName = faker.person.fullName();
    // Simply use fill() - it should handle React controlled inputs
    // by clearing the existing value and typing the new one
    await input.fill(newName);

    // Verify the input has the new value before clicking save
    await expect(input).toHaveValue(newName);

    const saveButton = page.getByRole("button", {
      name: /Save profile|Enregistrer le profil/i,
    });

    // Wait for button to be enabled (form fully loaded)
    await expect(saveButton).toBeEnabled({ timeout: 10000 });

    // Click save button and wait for the Server Action to complete
    const responsePromise = page.waitForResponse(
      (response) => response.request().method() === "POST",
      { timeout: 15000 },
    );
    await saveButton.click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);

    // Verify the name was updated in the database
    const updatedUser = await prisma.user.findUnique({
      where: { email: userData.email },
      select: { name: true },
    });
    expect(updatedUser?.name).toBe(newName);
  });

  test("change password flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings/security",
    });
    await page.waitForURL(/\/settings\/security/, { timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    const currentPasswordInput = page.locator(
      'input[name="currentPassword"]',
    );
    const newPasswordInput = page.locator('input[name="newPassword"]');
    const confirmPasswordInput = page.locator(
      'input[name="confirmPassword"]',
    );
    await expect(currentPasswordInput).toBeVisible();
    await currentPasswordInput.fill(userData.password);
    await newPasswordInput.fill(newPassword);
    await confirmPasswordInput.fill(newPassword);
    await expect(currentPasswordInput).toHaveValue(userData.password);
    await expect(newPasswordInput).toHaveValue(newPassword);
    await expect(confirmPasswordInput).toHaveValue(newPassword);
    // i18n: button text is "Update password" or "Mettre à jour le mot de passe"
    await page
      .getByRole("button", { name: /Update password|Mettre à jour/i })
      .click();

    // i18n: success message is "Password updated" or "Mot de passe mis à jour"
    await expect(
      page.getByText(/Password updated|Mot de passe mis à jour/i),
    ).toBeVisible();

    await signOutAccount({ page });

    await signInAccount({
      page,
      userData: {
        email: userData.email,
        password: newPassword,
      },
      callbackURL: "/app",
    });

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});

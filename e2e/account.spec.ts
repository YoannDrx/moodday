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

test.describe("account", () => {
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

    // i18n: button text is "Delete account" (EN) / "Supprimer le compte" (FR)
    await page
      .getByRole("button", { name: /Delete account|Supprimer le compte/i })
      .click();
    await page.waitForURL(/\/auth\/goodbye/, { timeout: 10000 });
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

    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    await page.locator('input[name="currentPassword"]').fill(userData.password);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
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

    await page.waitForURL(/\/app/, { timeout: 10000 });

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

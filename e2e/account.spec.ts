import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

test.describe("account", () => {
  test("delete account flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings?tab=privacy",
    });

    await page.waitForURL(/\/settings\?tab=privacy/, { timeout: 10000 });
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

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user).toBeNull();
  });

  test("update name flow", async ({ page }) => {
    await createTestAccount({ page, callbackURL: "/settings?tab=profile" });
    await page.waitForURL(/\/settings\?tab=profile/, { timeout: 10000 });

    const newName = faker.person.fullName();
    const input = page.getByRole("textbox", { name: /Full name|Nom complet/i });
    await input.fill(newName);
    await page
      .getByRole("button", { name: /Save profile|Enregistrer le profil/i })
      .click();

    await expect(
      page.getByText(/Settings saved|Paramètres sauvegardés/i),
    ).toBeVisible();
    await page.reload();
    const updatedInput = page.getByRole("textbox", {
      name: /Full name|Nom complet/i,
    });
    await expect(updatedInput).toHaveValue(newName);
  });

  test("change password flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings?tab=security",
    });
    await page.waitForURL(/\/settings\?tab=security/, { timeout: 10000 });

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

import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("enforces the Free caregiver limit across concurrent invitations", async ({
  context,
  page,
}) => {
  const patientData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });
  const patient = await prisma.user.findUniqueOrThrow({
    where: { email: patientData.email },
    select: { id: true },
  });
  const secondPage = await context.newPage();
  const invitedEmails = [
    `playwright-test-concurrent-a-${faker.string.uuid()}@example.test`,
    `playwright-test-concurrent-b-${faker.string.uuid()}@example.test`,
  ];

  try {
    await Promise.all([page.goto("/caregiver"), secondPage.goto("/caregiver")]);
    await Promise.all(
      [page, secondPage].map(async (currentPage, index) => {
        await currentPage
          .getByRole("button", { name: /Invite someone|Inviter quelqu'un/i })
          .last()
          .click();
        await currentPage
          .getByLabel(/^Email$|^E-mail$/i)
          .fill(invitedEmails[index] ?? "missing@example.test");
      }),
    );

    await Promise.all(
      [page, secondPage].map(async (currentPage) =>
        currentPage
          .getByRole("button", {
            name: /Send invite|Envoyer l'invitation/i,
          })
          .click(),
      ),
    );

    await expect
      .poll(async () =>
        prisma.caregiverRelationship.count({
          where: {
            patientId: patient.id,
            status: { in: ["pending", "active"] },
            revokedAt: null,
          },
        }),
      )
      .toBe(1);
  } finally {
    await secondPage.close();
    await prisma.user.delete({ where: { id: patient.id } });
  }
});

test("revokes caregiver access immediately after an authorized observation", async ({
  baseURL,
  browser,
  page,
}) => {
  const caregiverContext = await browser.newContext({ baseURL });
  const caregiverPage = await caregiverContext.newPage();

  try {
    const caregiverData = await createTestAccount({
      page: caregiverPage,
      callbackURL: "/dashboard",
    });
    const caregiver = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: caregiverData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );

    const patientData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });
    const patient = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: patientData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );

    await page.goto("/caregiver");
    await page
      .getByRole("button", { name: /Invite someone|Inviter quelqu'un/i })
      .last()
      .click();
    await page.getByLabel(/^Email$|^E-mail$/i).fill(caregiverData.email);
    await page
      .getByRole("button", {
        name: /Send invite|Envoyer l'invitation/i,
      })
      .click();
    await expect(
      page.getByText(/Invite sent|Invitation envoyée/i),
    ).toBeVisible();

    const relationship = await retry(
      async () =>
        prisma.caregiverRelationship.findFirstOrThrow({
          where: {
            patientId: patient.id,
            caregiverId: caregiver.id,
            status: "pending",
          },
          select: { id: true, inviteToken: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );
    expect(relationship.inviteToken).not.toBeNull();

    await caregiverPage.goto(
      `/invite/caregiver?token=${relationship.inviteToken}`,
    );
    await caregiverPage
      .getByRole("button", { name: /^Accept$|^Accepter$/i })
      .click();
    await caregiverPage.waitForURL(/\/caregiver$/);

    await caregiverPage.goto("/caregiver/observe");
    await expect(
      caregiverPage.getByRole("heading", {
        level: 1,
        name: /New observation|Nouvelle observation/i,
      }),
    ).toBeVisible();
    await caregiverPage
      .getByLabel(/^Notes$/i)
      .fill("Visible authorized observation");
    await caregiverPage
      .getByRole("button", {
        name: /Save check-in|Enregistrer le check-in/i,
      })
      .click();
    await caregiverPage.waitForURL(/\/caregiver$/);

    await expect
      .poll(async () =>
        prisma.caregiverObservation.count({
          where: {
            observerId: caregiver.id,
            subjectId: patient.id,
            notes: "Visible authorized observation",
          },
        }),
      )
      .toBe(1);

    await page.goto("/caregiver");
    await page
      .getByRole("button", {
        name: /Remove .* from the caregiver circle|Retirer .* du cercle d'aidants/i,
      })
      .click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /^Remove$|^Retirer$/i })
      .click();
    await expect(
      page.getByText(/Caregiver removed|Aidant retiré/i),
    ).toBeVisible();

    await expect
      .poll(async () =>
        prisma.caregiverRelationship.findUnique({
          where: { id: relationship.id },
          select: {
            status: true,
            revokedAt: true,
            revokedById: true,
            inviteToken: true,
          },
        }),
      )
      .toEqual({
        status: "revoked",
        revokedAt: expect.any(Date),
        revokedById: patient.id,
        inviteToken: null,
      });

    await caregiverPage.goto(`/caregiver/observe?revoked=${Date.now()}`);
    await expect(
      caregiverPage.getByRole("heading", {
        level: 2,
        name: /No active person to support|Aucune personne à accompagner/i,
      }),
    ).toBeVisible();
    await expect(caregiverPage.getByLabel(/^Notes$/i)).toHaveCount(0);
  } finally {
    await caregiverContext.close();
  }
});

test("declines an invitation and invalidates its token", async ({
  baseURL,
  browser,
  page,
}) => {
  const caregiverContext = await browser.newContext({ baseURL });
  const caregiverPage = await caregiverContext.newPage();

  try {
    const caregiverData = await createTestAccount({
      page: caregiverPage,
      callbackURL: "/dashboard",
    });
    const caregiver = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: caregiverData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );
    const patientData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });
    const patient = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: patientData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );

    await page.goto("/caregiver");
    await page
      .getByRole("button", { name: /Invite someone|Inviter quelqu'un/i })
      .last()
      .click();
    await page.getByLabel(/^Email$|^E-mail$/i).fill(caregiverData.email);
    await page
      .getByRole("button", {
        name: /Send invite|Envoyer l'invitation/i,
      })
      .click();

    const relationship = await retry(
      async () =>
        prisma.caregiverRelationship.findFirstOrThrow({
          where: { patientId: patient.id, caregiverId: caregiver.id },
          select: { id: true, inviteToken: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );
    expect(relationship.inviteToken).not.toBeNull();

    await caregiverPage.goto(
      `/invite/caregiver?token=${relationship.inviteToken}`,
    );
    await caregiverPage
      .getByRole("button", { name: /^Decline$|^Refuser$/i })
      .click();
    await caregiverPage.waitForURL(/\/dashboard$/);

    await expect
      .poll(async () =>
        prisma.caregiverRelationship.findUnique({
          where: { id: relationship.id },
          select: { status: true, inviteToken: true, inviteExpiry: true },
        }),
      )
      .toEqual({ status: "declined", inviteToken: null, inviteExpiry: null });
  } finally {
    await caregiverContext.close();
  }
});

test("blocks an expired caregiver invitation", async ({
  baseURL,
  browser,
  page,
}) => {
  const caregiverContext = await browser.newContext({ baseURL });
  const caregiverPage = await caregiverContext.newPage();
  let expiredInviteContext: Awaited<
    ReturnType<typeof browser.newContext>
  > | null = null;

  try {
    const caregiverData = await createTestAccount({
      page: caregiverPage,
      callbackURL: "/dashboard",
    });
    const caregiver = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: caregiverData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );
    const patientData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });
    const patient = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: patientData.email },
          select: { id: true },
        }),
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );
    const expiredToken = `expired-${Date.now()}`;

    await prisma.caregiverRelationship.create({
      data: {
        patientId: patient.id,
        caregiverId: caregiver.id,
        caregiverEmail: caregiverData.email,
        role: "family",
        permissions: ["view_mood"],
        status: "pending",
        inviteToken: expiredToken,
        inviteExpiry: new Date("2026-01-01T00:00:00.000Z"),
      },
    });

    const caregiverStorage = await caregiverContext.storageState();
    expiredInviteContext = await browser.newContext({
      baseURL,
      storageState: caregiverStorage,
    });
    const expiredInvitePage = await expiredInviteContext.newPage();

    await expiredInvitePage.goto(`/invite/caregiver?token=${expiredToken}`);
    await expect(expiredInvitePage).toHaveURL(
      new RegExp(`/invite/caregiver\\?token=${expiredToken}$`),
    );
    await expect(
      expiredInvitePage.getByRole("heading", {
        name: /Caregiver invite|Invitation d['’]aidant/i,
      }),
    ).toBeVisible();
    await expect(
      expiredInvitePage.getByText(/invalid|expired|invalide|expirée|expiré/i),
    ).toBeVisible();
    await expect(
      expiredInvitePage.getByRole("button", {
        name: /^Accept$|^Accepter$/i,
      }),
    ).toHaveCount(0);
  } finally {
    await expiredInviteContext?.close();
    await caregiverContext.close();
  }
});

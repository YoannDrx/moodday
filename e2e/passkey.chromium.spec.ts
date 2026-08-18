import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("a registered passkey can sign in without a password", async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );

  try {
    const userData = await createTestAccount({
      page,
      callbackURL: "/settings/security",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
      select: { id: true },
    });

    await page
      .getByRole("button", { name: /Add a passkey|Ajouter une passkey/i })
      .click();
    await retry(
      async () => {
        const passkeyCount = await prisma.passkey.count({
          where: { userId: user.id },
        });
        if (passkeyCount !== 1) throw new Error("Passkey was not persisted");
        return passkeyCount;
      },
      { maxAttempts: 5, delayMs: 250, backoff: true },
    );

    await signOutAccount({ page });
    await page.goto("/auth/signin?callbackUrl=/dashboard");
    await page
      .getByRole("button", {
        name: /Continue with a passkey|Continuer avec une passkey/i,
      })
      .click();
    await page.waitForURL((url) => url.pathname === "/dashboard");
    await expect(page.getByRole("main")).toBeVisible();

    await prisma.user.delete({ where: { id: user.id } });
  } finally {
    await cdp
      .send("WebAuthn.removeVirtualAuthenticator", { authenticatorId })
      .catch(() => undefined);
    await cdp.send("WebAuthn.disable").catch(() => undefined);
  }
});

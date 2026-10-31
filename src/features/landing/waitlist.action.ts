"use server";

import { headers } from "next/headers";

import WaitlistConfirmationEmail, {
  subject as waitlistSubject,
} from "@email/couple/waitlist-confirmation";
import { action } from "@/lib/actions/safe-actions";
import { sendEmail } from "@/lib/mail/send-email";
import { normalizeSignupEmail } from "@/lib/auth/signup-access";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { JoinWaitlistSchema } from "./waitlist.schema";

const WAITLIST_SOURCE = "waitlist";

export const joinWaitlistAction = action
  .inputSchema(JoinWaitlistSchema)
  .action(async ({ parsedInput: { email, locale, door } }) => {
    const normalizedEmail = normalizeSignupEmail(email);
    const requestHeaders = await headers();
    const clientIp =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";

    await enforceRateLimit({
      scope: "public-waitlist-ip",
      identifier: clientIp,
      max: 10,
      windowSeconds: 60 * 60,
    });
    await enforceRateLimit({
      scope: "public-waitlist-email",
      identifier: normalizedEmail,
      max: 3,
      windowSeconds: 60 * 60,
    });

    // An existing subscriber keeps its original source so the waitlist never
    // reveals whether an address was already known.
    const known = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        locale,
        source: WAITLIST_SOURCE,
        door,
        consentAt: new Date(),
      },
      update: {},
    });

    if (!known) {
      // Confirmation only; the response stays identical either way.
      await sendEmail({
        to: normalizedEmail,
        subject: waitlistSubject,
        html: WaitlistConfirmationEmail(),
        tracking: { template: "waitlist-confirmation" },
      }).catch(() => undefined);
    }

    return { joined: true };
  });

"use server";

import { action } from "@/lib/actions/safe-actions";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/send-email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ContactSupportSchema } from "./contact-support.schema";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

export const contactSupportAction = action
  .inputSchema(ContactSupportSchema)
  .action(async ({ parsedInput: { email, subject, message } }) => {
    await enforceRateLimit({
      scope: "public-support",
      identifier: email,
      max: 3,
      windowSeconds: 60 * 60,
    });
    await sendEmail({
      to: env.NEXT_PUBLIC_EMAIL_CONTACT,
      subject: "Moodday support request",
      text: `${subject}\n\n${message}`,
      html: `<p><strong>${escapeHtml(subject)}</strong></p><pre>${escapeHtml(message)}</pre>`,
      replyTo: email,
      tracking: {
        template: "support",
      },
    });
    return { message: "Your message has been sent to support." };
  });

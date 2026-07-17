import type { Prisma } from "@/generated/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { pretty, render } from "@react-email/render";
import { nanoid } from "nanoid";
import { resendMailAdapter } from "./resend";

type EmailParams = {
  from: string;
  to: string | string[];
  subject: string;

  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
  html: string;
};

type Attachment = {
  content?: string | Buffer;
  filename?: string | false | undefined;
  path?: string;
  contentType?: string;
};

export type MailAdapter = {
  send: (params: EmailParams) => Promise<
    | {
        error: null;
        data: {
          id: string;
        };
      }
    | {
        error: Error;
        data: null;
      }
  >;
};

/**
 * sendEmail will send an email using resend.
 * To avoid repeating the same "from" email, you can leave it empty and it will use the default one.
 * Also, in development, it will add "[DEV]" to the subject.
 * @param params[0] : payload
 * @param params[1] : options
 * @returns a promise of the email sent
 */

// If you use another mail adapter, you can replace the mailAdapter with your own
const mailAdapter: MailAdapter = resendMailAdapter;

type EmailTrackingParams = {
  template: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
};

type SendEmailParams = Omit<EmailParams, "from" | "html"> & {
  from?: string;
  html?: string | React.ReactElement;
  tracking?: EmailTrackingParams;
};

export const sendEmail = async (params: SendEmailParams) => {
  const { tracking, ...emailParams } = params;

  if (env.NODE_ENV === "development") {
    emailParams.subject = `[DEV] ${emailParams.subject}`;
  }

  // Avoid sending emails to playwright-test emails
  if (
    Array.isArray(emailParams.to)
      ? emailParams.to.some((to) => to.startsWith("playwright-test-"))
      : emailParams.to.startsWith("playwright-test-")
  ) {
    logger.info("[sendEmail] Sending email to playwright-test", {
      subject: emailParams.subject,
      to: emailParams.to,
    });

    return {
      error: null,
      data: {
        id: nanoid(),
      },
    };
  }

  let html = "";

  if (typeof emailParams.html === "string") {
    html = emailParams.html;
  } else {
    html = await pretty(await render(emailParams.html));
  }

  const result = await mailAdapter.send({
    ...emailParams,
    from: emailParams.from ?? env.EMAIL_FROM,
    replyTo: emailParams.replyTo ?? env.NEXT_PUBLIC_EMAIL_CONTACT,
    html,
  });

  if (result.error) {
    logger.error("[sendEmail] Error", { result, subject: emailParams.subject });
  }

  // Log to database if tracking is enabled
  if (tracking) {
    try {
      const toAddress = Array.isArray(emailParams.to)
        ? emailParams.to.join(", ")
        : emailParams.to;

      await prisma.emailLog.create({
        data: {
          resendId: result.data?.id ?? null,
          to: toAddress,
          subject: emailParams.subject,
          template: tracking.template,
          userId: tracking.userId,
          metadata: tracking.metadata ?? undefined,
          status: result.error ? "failed" : "sent",
          error: result.error?.message ?? null,
        },
      });
    } catch (err) {
      logger.error("[sendEmail] Failed to log email to database", { err });
    }
  }

  return result;
};

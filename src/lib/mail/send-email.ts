import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { pretty, render } from "react-email";
import { nanoid } from "nanoid";
import { getOperationalIdentifier } from "@/lib/operations/log-identifiers";
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
    logger.info("Email delivery skipped for isolated browser test", {
      eventName: "email_delivery_test_skipped",
      status: "succeeded",
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
    logger.error("Email delivery failed", {
      eventName: "email_delivery_failed",
      status: "failed",
      errorCode: result.error.name,
    });
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
          recipientReference: getOperationalIdentifier(
            "email-recipient",
            toAddress.trim().toLocaleLowerCase("en-US"),
          ),
          to: "[redacted]",
          subject: tracking.template,
          template: tracking.template,
          userId: tracking.userId,
          metadata: undefined,
          status: result.error ? "failed" : "sent",
          error: result.error?.name ?? null,
        },
      });
    } catch (error) {
      logger.error("Email delivery audit write failed", {
        eventName: "email_delivery_audit_failed",
        status: "failed",
        errorCode: error instanceof Error ? error.name : "unknown_error",
      });
    }
  }

  return result;
};

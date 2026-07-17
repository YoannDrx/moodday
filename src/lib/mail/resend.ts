import { Resend } from "resend";
import { env } from "../env";
import { logger } from "../logger";
import type { MailAdapter } from "./send-email";

export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

export function getResend(): Resend {
  if (!resend) {
    throw new Error(
      "Resend is not configured. Please set RESEND_API_KEY environment variable.",
    );
  }
  return resend;
}

export const resendMailAdapter: MailAdapter = {
  send: async (params) => {
    if (!resend) {
      logger.warn(
        "Resend is not configured. Email delivery failed. Set RESEND_API_KEY to enable it.",
      );
      return {
        error: new Error(
          "Resend is not configured. Please set RESEND_API_KEY environment variable.",
        ),
        data: null,
      };
    }

    const result = await resend.emails.send(params);

    if (result.error) {
      return { error: new Error(result.error.message), data: null };
    }

    return { error: null, data: { id: result.data.id } };
  },
};

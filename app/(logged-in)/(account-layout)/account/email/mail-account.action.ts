"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { logger } from "@/lib/logger";
import { getResend } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { env } from "process";
import { z } from "zod";

const ToggleSubscribedActionSchema = z.object({
  unsubscribed: z.boolean(),
});

export const toggleSubscribedAction = authAction
  .inputSchema(ToggleSubscribedActionSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    logger.debug("Toggle subscribed", { input, ctx });

    if (!env.RESEND_AUDIENCE_ID) {
      throw new ActionError("RESEND_AUDIENCE_ID is not set");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
      select: {
        resendContactId: true,
      },
    });

    if (!user?.resendContactId) {
      throw new ActionError("User has no resend contact id");
    }

    const updateContact = await getResend().contacts.update({
      audienceId: env.RESEND_AUDIENCE_ID,
      id: user.resendContactId,
      unsubscribed: input.unsubscribed,
    });

    return {
      success: true,
      updateContact,
    };
  });

export const getEmailPreferencesAction = authAction.action(
  async ({ ctx }) => {
    if (!env.RESEND_AUDIENCE_ID) {
      return { available: false, unsubscribed: false };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
      select: {
        resendContactId: true,
      },
    });

    if (!user?.resendContactId) {
      return { available: false, unsubscribed: false };
    }

    const { data: resendUser } = await getResend().contacts.get({
      audienceId: env.RESEND_AUDIENCE_ID,
      id: user.resendContactId,
    });

    if (!resendUser) {
      return { available: false, unsubscribed: false };
    }

    return { available: true, unsubscribed: resendUser.unsubscribed };
  },
);

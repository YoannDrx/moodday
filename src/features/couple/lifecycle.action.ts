"use server";

import { action, authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { unsubscribeFromLifecycleEmails } from "./lifecycle.service";

/** Public on purpose: the signed token in the email is the authorisation. */
export const unsubscribeLifecycleAction = action
  .inputSchema(z.object({ token: z.string().min(10).max(200) }))
  .action(async ({ parsedInput }) => ({
    done: await unsubscribeFromLifecycleEmails(parsedInput.token),
  }));

export const setLifecycleEmailsAction = authAction
  .inputSchema(z.object({ enabled: z.boolean() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    await prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, lifecycleEmails: parsedInput.enabled },
      update: { lifecycleEmails: parsedInput.enabled },
    });
    return { enabled: parsedInput.enabled };
  });

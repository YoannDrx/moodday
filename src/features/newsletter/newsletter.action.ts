"use server";

import { action } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { NewsletterSchema } from "./newsletter.schema";

export const subscribeToNewsletterAction = action
  .inputSchema(NewsletterSchema)
  .action(async ({ parsedInput: { email, locale, source } }) => {
    logger.info("Newsletter subscription attempt", { email, locale, source });

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        ok: true,
        alreadySubscribed: true,
      };
    }

    // Create new subscriber
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        locale,
        source,
      },
    });

    logger.info("Newsletter subscription successful", { email });

    return {
      ok: true,
      alreadySubscribed: false,
    };
  });

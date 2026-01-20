"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const getStripeCustomerId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new ActionError("No stripe customer id found");
  }

  return user.stripeCustomerId;
};

export const openStripePortalAction = authAction.action(
  async ({ ctx: { user } }) => {
    const stripeCustomerId = await getStripeCustomerId(user.id);

    if (!stripeCustomerId) {
      throw new ActionError("No stripe customer id found");
    }

    const stripeBilling = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getServerUrl()}/account/billing`,
    });

    if (!stripeBilling.url) {
      throw new ActionError("Failed to create stripe billing portal session");
    }

    return {
      url: stripeBilling.url,
    };
  },
);

export const cancelSubscriptionAction = authAction
  .inputSchema(
    z.object({
      returnUrl: z.string().url(),
    }),
  )
  .action(async ({ parsedInput: { returnUrl }, ctx: { user } }) => {
    const stripeCustomerId = await getStripeCustomerId(user.id);

    if (!stripeCustomerId) {
      throw new ActionError("No stripe customer id found");
    }

    // Get the current subscription
    const subscription = await prisma.subscription.findFirst({
      where: { referenceId: user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new ActionError("No active subscription found");
    }

    // Create billing portal session which allows the user to cancel
    const stripeBilling = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getServerUrl()}${returnUrl}`,
    });

    if (!stripeBilling.url) {
      throw new ActionError("Failed to create stripe billing portal session");
    }

    return {
      url: stripeBilling.url,
    };
  });

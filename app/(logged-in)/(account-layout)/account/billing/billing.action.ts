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

const stripePortalSchema = z.object({
  returnUrl: z.string().min(1).optional(),
});

const DEFAULT_BILLING_RETURN_PATH = "/settings/subscription";

const getSafeStripeReturnUrl = (returnUrl?: string) => {
  const serverUrl = new URL(getServerUrl());

  if (!returnUrl) {
    return new URL(DEFAULT_BILLING_RETURN_PATH, serverUrl).toString();
  }

  try {
    const parsedUrl = new URL(returnUrl, serverUrl);
    if (parsedUrl.origin !== serverUrl.origin) {
      return new URL(DEFAULT_BILLING_RETURN_PATH, serverUrl).toString();
    }

    return parsedUrl.toString();
  } catch {
    return new URL(DEFAULT_BILLING_RETURN_PATH, serverUrl).toString();
  }
};

export const openStripePortalAction = authAction
  .inputSchema(stripePortalSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const stripeCustomerId = await getStripeCustomerId(user.id);

    if (!stripeCustomerId) {
      throw new ActionError("No stripe customer id found");
    }

    const stripeBilling = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: getSafeStripeReturnUrl(parsedInput.returnUrl),
    });

    if (!stripeBilling.url) {
      throw new ActionError("Failed to create stripe billing portal session");
    }

    return {
      url: stripeBilling.url,
    };
  });

export const cancelSubscriptionAction = authAction
  .inputSchema(
    z.object({
      returnUrl: z.string().min(1),
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

    const stripeBilling = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: getSafeStripeReturnUrl(returnUrl),
    });

    if (!stripeBilling.url) {
      throw new ActionError("Failed to create stripe billing portal session");
    }

    return {
      url: stripeBilling.url,
    };
  });

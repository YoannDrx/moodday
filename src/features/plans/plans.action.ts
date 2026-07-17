"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const internalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Invalid internal path");

const getCheckoutSuccessUrl = (path: string) => {
  const separator = path.includes("?") ? "&" : "?";
  return `${getServerUrl()}${path}${separator}session_id={CHECKOUT_SESSION_ID}`;
};

export const upgradeUserAction = authAction
  .inputSchema(
    z.object({
      plan: z.string(),
      annual: z.boolean().default(false),
      successUrl: internalPathSchema,
      cancelUrl: internalPathSchema,
    }),
  )
  .action(
    async ({
      parsedInput: { plan, annual, successUrl, cancelUrl },
      ctx: { user },
    }) => {
      // Find the plan
      const authPlan = AUTH_PLANS.find((p) => p.name === plan);
      if (!authPlan) {
        throw new ActionError(`Plan "${plan}" not found`);
      }

      // Get the price ID based on annual or monthly
      const priceId = annual
        ? authPlan.annualDiscountPriceId
        : authPlan.priceId;
      if (!priceId) {
        throw new ActionError(`Price ID not found for plan "${plan}"`);
      }

      // Get the full user from database to access stripeCustomerId
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true, email: true, name: true },
      });

      if (!dbUser) {
        throw new ActionError("User not found");
      }

      // Create Stripe customer if not exists
      let customerId = dbUser.stripeCustomerId;
      if (!customerId) {
        const stripeCustomer = await getStripe().customers.create({
          email: dbUser.email,
          name: dbUser.name,
          metadata: {
            userId: user.id,
          },
        });

        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: stripeCustomer.id },
        });

        customerId = stripeCustomer.id;
      }

      // Create checkout session
      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: getCheckoutSuccessUrl(successUrl),
        cancel_url: `${getServerUrl()}${cancelUrl}`,
        metadata: {
          userId: user.id,
          plan: plan,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            plan: plan,
          },
          trial_period_days: authPlan.freeTrial?.days,
        },
      });

      if (!session.url) {
        throw new ActionError("Failed to create checkout session");
      }

      return {
        url: session.url,
      };
    },
  );

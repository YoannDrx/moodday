"use server";

import { sensitiveAuthAction } from "@/lib/actions/safe-actions";
import {
  assertConfiguredStripePrice,
  BILLING_CATALOG_VERSION,
  getPlanFromPriceId,
} from "@/lib/billing/catalog";
import { ActionError } from "@/lib/errors/action-error";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getServerUrl } from "@/lib/server-url";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";
import { assertFeatureAvailable } from "@/lib/features/availability";

const internalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Invalid internal path");

const getCheckoutSuccessUrl = (path: string) => {
  const separator = path.includes("?") ? "&" : "?";
  return `${getServerUrl()}${path}${separator}session_id={CHECKOUT_SESSION_ID}`;
};

const ACTIVE_STRIPE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
]);

export const upgradeUserAction = sensitiveAuthAction
  .inputSchema(
    z.object({
      plan: z.literal("plus"),
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
      assertFeatureAvailable("billing");
      await enforceRateLimit({
        scope: "stripe-checkout",
        identifier: user.id,
        max: 5,
        windowSeconds: 60 * 60,
      });

      const interval = annual ? "yearly" : "monthly";
      const price = await assertConfiguredStripePrice(interval);

      // Get the full user from database to access stripeCustomerId
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          stripeCustomerId: true,
          email: true,
          name: true,
          subscription: {
            select: { trialUsedAt: true, stripeSubscriptionId: true },
          },
        },
      });

      if (!dbUser) {
        throw new ActionError("User not found");
      }

      let customerId = dbUser.stripeCustomerId;
      const stripe = getStripe();
      if (!customerId) {
        const stripeCustomer = await stripe.customers.create({
          email: dbUser.email,
          name: dbUser.name,
          metadata: {
            app: "moodday",
            userId: user.id,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: stripeCustomer.id },
        });

        customerId = stripeCustomer.id;
      }

      const [openSessions, stripeSubscriptions] = await Promise.all([
        stripe.checkout.sessions.list({
          customer: customerId,
          status: "open",
          limit: 10,
        }),
        stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 100,
        }),
      ]);
      const existingOpenSession = openSessions.data.find(
        (candidate) =>
          candidate.mode === "subscription" &&
          candidate.client_reference_id === user.id &&
          candidate.url,
      );
      if (existingOpenSession?.url) {
        return { url: existingOpenSession.url };
      }

      const mooddaySubscriptions = stripeSubscriptions.data.filter(
        (subscription) =>
          subscription.items.data.some((item) =>
            Boolean(getPlanFromPriceId(item.price.id)),
          ),
      );
      if (
        mooddaySubscriptions.some((subscription) =>
          ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.has(subscription.status),
        )
      ) {
        throw new ActionError(
          "A Moodday Plus subscription already exists for this account",
        );
      }

      const isTrialEligible =
        !dbUser.subscription?.trialUsedAt &&
        !dbUser.subscription?.stripeSubscriptionId &&
        !mooddaySubscriptions.some((subscription) =>
          Boolean(subscription.trial_start),
        );

      const session = await stripe.checkout.sessions.create(
        {
          customer: customerId,
          client_reference_id: user.id,
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          mode: "subscription",
          integration_identifier: "moodday_checkout_kqnxpajt",
          payment_method_collection: isTrialEligible ? "if_required" : "always",
          automatic_tax: { enabled: env.STRIPE_TAX_ENABLED },
          success_url: getCheckoutSuccessUrl(successUrl),
          cancel_url: `${getServerUrl()}${cancelUrl}`,
          metadata: {
            userId: user.id,
            plan,
            catalogVersion: BILLING_CATALOG_VERSION,
          },
          subscription_data: {
            metadata: {
              app: "moodday",
              userId: user.id,
              plan,
              catalogVersion: BILLING_CATALOG_VERSION,
            },
            ...(isTrialEligible
              ? {
                  trial_period_days: 14,
                  trial_settings: {
                    end_behavior: {
                      missing_payment_method: "cancel" as const,
                    },
                  },
                }
              : {}),
          },
        },
        {
          idempotencyKey: `moodday-checkout-${user.id}-${interval}-${Math.floor(Date.now() / 300_000)}`,
        },
      );

      if (!session.url) {
        throw new ActionError("Failed to create checkout session");
      }

      return {
        url: session.url,
      };
    },
  );

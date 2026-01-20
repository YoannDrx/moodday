import Stripe from "stripe";
import { env } from "./env";

const stripeInstance = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  : null;

export const stripe = stripeInstance;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.",
    );
  }
  return stripeInstance;
}

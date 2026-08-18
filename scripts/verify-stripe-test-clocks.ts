/* eslint-disable no-console, no-await-in-loop -- controlled sequential Stripe simulation */
import assert from "node:assert/strict";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const monthlyPriceId = process.env.STRIPE_PLUS_MONTHLY_PRICE_ID;
const yearlyPriceId = process.env.STRIPE_PLUS_YEARLY_PRICE_ID;
if (process.env.STRIPE_TEST_CLOCKS_ACK !== "isolated-test-mode") {
  throw new Error(
    "Set STRIPE_TEST_CLOCKS_ACK=isolated-test-mode to create temporary test data",
  );
}
if (!secretKey?.startsWith("sk_test_") && !secretKey?.startsWith("rk_test_")) {
  throw new Error("Test Clocks require a Stripe test-mode key");
}
if (!monthlyPriceId || !yearlyPriceId) {
  throw new Error("Both Moodday Plus test price IDs are required");
}
const verifiedMonthlyPriceId = monthlyPriceId;
const verifiedYearlyPriceId = yearlyPriceId;

const stripe = new Stripe(secretKey);
const createdClockIds: string[] = [];
const HOUR = 60 * 60;

async function waitUntilReady(clockId: string) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
    if (clock.status === "ready") return clock;
    if (clock.status === "internal_failure") {
      throw new Error("Stripe test clock failed internally");
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("Stripe test clock did not become ready within two minutes");
}

async function createClock(name: string, frozenTime: number) {
  const clock = await stripe.testHelpers.testClocks.create({
    name,
    frozen_time: frozenTime,
  });
  createdClockIds.push(clock.id);
  return clock;
}

async function advance(clockId: string, frozenTime: number) {
  await stripe.testHelpers.testClocks.advance(clockId, {
    frozen_time: frozenTime,
  });
  return waitUntilReady(clockId);
}

async function createClockCustomer(clockId: string, paymentMethod: string) {
  return stripe.customers.create({
    test_clock: clockId,
    payment_method: paymentMethod,
    invoice_settings: { default_payment_method: paymentMethod },
    metadata: { app: "moodday", purpose: "automated_test_clock" },
  });
}

async function verifySuccessfulLifecycle(frozenTime: number) {
  const clock = await createClock(
    "Moodday automated successful lifecycle",
    frozenTime,
  );
  const customer = await createClockCustomer(clock.id, "pm_card_visa");
  let subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: verifiedMonthlyPriceId }],
    default_payment_method: "pm_card_visa",
    trial_period_days: 14,
    metadata: { app: "moodday", plan: "plus", test: "test_clock" },
  });
  assert.equal(subscription.status, "trialing");
  assert(subscription.trial_end);

  await advance(clock.id, subscription.trial_end + HOUR);
  subscription = await stripe.subscriptions.retrieve(subscription.id);
  assert.equal(subscription.status, "active");

  const firstItem = subscription.items.data[0];
  assert(firstItem);
  await advance(clock.id, firstItem.current_period_end + HOUR);
  subscription = await stripe.subscriptions.retrieve(subscription.id);
  assert.equal(subscription.status, "active");

  subscription = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });
  assert.equal(subscription.cancel_at_period_end, true);
  subscription = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
  });
  assert.equal(subscription.cancel_at_period_end, false);

  const item = subscription.items.data[0];
  assert(item);
  subscription = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: verifiedYearlyPriceId }],
    proration_behavior: "none",
  });
  assert.equal(subscription.items.data[0]?.price.id, verifiedYearlyPriceId);

  return {
    trialToActive: true,
    renewalSucceeded: true,
    cancelAtPeriodEnd: true,
    reactivated: true,
    monthlyToYearly: true,
  };
}

async function verifyInitialPaymentFailure(frozenTime: number) {
  const clock = await createClock(
    "Moodday automated failed payment",
    frozenTime,
  );
  const customer = await createClockCustomer(
    clock.id,
    "pm_card_chargeCustomerFail",
  );
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: verifiedMonthlyPriceId }],
    default_payment_method: "pm_card_chargeCustomerFail",
    payment_behavior: "allow_incomplete",
    metadata: { app: "moodday", plan: "plus", test: "test_clock" },
  });
  assert.equal(subscription.status, "incomplete");
  await stripe.subscriptions.cancel(subscription.id);
  return { initialPaymentFailed: true, immediateCancellation: true };
}

async function main() {
  const frozenTime = Math.floor(Date.now() / 1000) - HOUR;
  try {
    const account = await stripe.accounts.retrieveCurrent();
    if (!account.charges_enabled)
      throw new Error("Stripe test charges are disabled");
    const [monthly, yearly] = await Promise.all([
      stripe.prices.retrieve(verifiedMonthlyPriceId),
      stripe.prices.retrieve(verifiedYearlyPriceId),
    ]);
    assert.equal(monthly.livemode, false);
    assert.equal(yearly.livemode, false);

    const successful = await verifySuccessfulLifecycle(frozenTime);
    const failed = await verifyInitialPaymentFailure(frozenTime);
    console.log(
      JSON.stringify({
        ok: true,
        mode: "test",
        ...successful,
        ...failed,
        webhookReplayCoveredSeparately: true,
        noCustomerDataLogged: true,
      }),
    );
  } finally {
    for (const clockId of createdClockIds.reverse()) {
      try {
        await stripe.testHelpers.testClocks.del(clockId);
      } catch {
        // Stripe automatically deletes test-clock objects after retention;
        // cleanup failure must not hide the primary assertion failure.
      }
    }
  }
}

const keepProcessAlive = setInterval(() => undefined, 1_000);
void main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({
        ok: false,
        errorCode: error instanceof Error ? error.message : "test_clock_failed",
      }),
    );
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepProcessAlive));

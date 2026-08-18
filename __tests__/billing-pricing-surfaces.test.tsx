import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastError: vi.fn(),
  upgrade: vi.fn(),
  openStripePortalAction: vi.fn(),
  cancelSubscriptionAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));
vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({ execute: mocks.upgrade, isPending: false }),
}));
vi.mock("@/features/plans/plans.action", () => ({
  upgradeUserAction: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: () => Promise<unknown>;
    onSuccess?: (result: unknown) => void;
    onError?: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: () => {
      void options
        .mutationFn()
        .then((result) => options.onSuccess?.(result))
        .catch((error: Error) => options.onError?.(error));
    },
  }),
}));
vi.mock(
  "@app/(logged-in)/(account-layout)/account/billing/billing.action",
  () => ({
    openStripePortalAction: mocks.openStripePortalAction,
    cancelSubscriptionAction: mocks.cancelSubscriptionAction,
  }),
);
vi.mock("@/lib/actions/actions-utils", () => ({
  resolveActionResult: async (
    promise: Promise<{ data?: unknown; serverError?: string }>,
  ) => {
    const result = await promise;
    if (result.serverError) throw new Error(result.serverError);
    return result.data;
  },
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: "fr",
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
    tm: (key: string) =>
      key.includes("additionalFeatures")
        ? [
            {
              label: "Consultation report feature",
              description: "Consultation report description",
            },
            {
              label: "AI insight feature",
              description: "AI insight description",
            },
            {
              label: "Caregiver sharing feature",
              description: "Caregiver sharing description",
            },
          ]
        : [],
  }),
}));
vi.mock("@/features/page/layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
  LayoutActions: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  LayoutContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  LayoutHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  LayoutTitle: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
}));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
    ...props
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={props["aria-label"]}
      onClick={() => onCheckedChange(!checked)}
    >
      pricing-period
    </button>
  ),
}));

import { UserBilling } from "@app/(logged-in)/(account-layout)/account/billing/user-billing";
import { PricingCard } from "@/features/plans/pricing-card";
import { Pricing } from "@/features/plans/pricing-section";
import { AUTH_PLANS_DATA } from "@/lib/auth/stripe/auth-plans-data";

const subscription = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "subscription-1",
    userId: "user-1",
    plan: "plus",
    status: "active",
    stripeCustomerId: "cus_moodday",
    periodStart: new Date("2026-08-01T00:00:00Z"),
    periodEnd: new Date("2026-09-01T00:00:00Z"),
    cancelAtPeriodEnd: false,
    ...overrides,
  }) as never;

describe("billing and pricing surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.openStripePortalAction.mockResolvedValue({
      data: { url: "/portal" },
    });
    mocks.cancelSubscriptionAction.mockResolvedValue({
      data: { url: "/cancel" },
    });
  });

  it("opens the customer portal and cancellation through server actions", async () => {
    render(<UserBilling subscription={subscription()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "account.billing.manage" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "account.billing.cancel" }),
    );
    await waitFor(() =>
      expect(mocks.openStripePortalAction).toHaveBeenCalledWith({
        returnUrl: "/pricing",
      }),
    );
    expect(mocks.cancelSubscriptionAction).toHaveBeenCalledWith({
      returnUrl: "/pricing",
    });
    expect(mocks.push).toHaveBeenCalledWith("/portal");
    expect(mocks.push).toHaveBeenCalledWith("/cancel");
    expect(screen.getByText("plans.names.plus")).toBeInTheDocument();
  });

  it("blocks portal access without a Stripe customer", async () => {
    render(
      <UserBilling subscription={subscription({ stripeCustomerId: null })} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "account.billing.manage" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "account.billing.noStripeCustomer",
      ),
    );
    expect(mocks.openStripePortalAction).not.toHaveBeenCalled();
  });

  it("renders trial, scheduled cancellation and non-active recovery states", () => {
    const view = render(
      <UserBilling
        subscription={subscription({
          status: "trialing",
          periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })}
      />,
    );
    expect(
      screen.getByText(/account.billing.trialRemaining/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("account.billing.cancel"),
    ).not.toBeInTheDocument();

    view.rerender(
      <UserBilling subscription={subscription({ cancelAtPeriodEnd: true })} />,
    );
    expect(screen.getByText(/account.billing.endsOn/)).toBeInTheDocument();

    view.rerender(
      <UserBilling subscription={subscription({ status: "past_due" })} />,
    );
    expect(
      screen.getByRole("button", { name: "account.billing.reactivate" }),
    ).toBeInTheDocument();
  });

  it("keeps Plus unavailable while billing is disabled", () => {
    const plus = AUTH_PLANS_DATA.find((plan) => plan.name === "plus");
    if (!plus) throw new Error("Plus plan missing");
    render(<PricingCard plan={plus} isYearly billingEnabled={false} />);
    expect(screen.getByText("pricingCard.ctaUnavailable")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText(/pricingCard.save/)).toBeInTheDocument();
    expect(screen.getByText(/pricingCard.billedYearly/)).toBeInTheDocument();
    expect(screen.queryByText(/pricingCard.freeTrial/)).not.toBeInTheDocument();
    expect(screen.queryByText("AI insight feature")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Caregiver sharing feature"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/plans\.limits\.caregivers/),
    ).not.toBeInTheDocument();
  });

  it("only advertises sensitive Plus features when their server flags are enabled", () => {
    const plus = AUTH_PLANS_DATA.find((plan) => plan.name === "plus");
    if (!plus) throw new Error("Plus plan missing");

    render(
      <PricingCard
        plan={plus}
        billingEnabled
        aiInsightsEnabled
        caregiverSharingEnabled
      />,
    );

    expect(screen.getByText("AI insight feature")).toBeInTheDocument();
    expect(screen.getByText("Caregiver sharing feature")).toBeInTheDocument();
    expect(screen.getByText(/pricingCard.freeTrial/)).toBeInTheDocument();
    expect(screen.getAllByText(/plans\.limits\.caregivers/)).not.toHaveLength(
      0,
    );
  });

  it("submits only the approved Plus catalogue in dashboard mode", () => {
    const plus = AUTH_PLANS_DATA.find((plan) => plan.name === "plus");
    const free = AUTH_PLANS_DATA.find((plan) => plan.name === "free");
    if (!plus || !free) throw new Error("Required catalogue plans missing");
    const view = render(<PricingCard plan={plus} billingEnabled />);
    fireEvent.click(
      screen.getByRole("button", { name: "pricingCard.ctaMonthly" }),
    );
    expect(mocks.upgrade).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "plus", annual: undefined }),
    );

    view.rerender(<PricingCard plan={free} billingEnabled />);
    expect(
      screen.getByRole("button", { name: "pricingCard.ctaFree" }),
    ).toBeDisabled();
  });

  it("links landing CTAs to signup and toggles the catalogue period", () => {
    const plus = AUTH_PLANS_DATA.find((plan) => plan.name === "plus");
    if (!plus) throw new Error("Plus plan missing");
    const view = render(
      <PricingCard plan={plus} mode="landing" billingEnabled />,
    );
    expect(
      screen.getByRole("link", { name: "pricingCard.ctaMonthly" }),
    ).toHaveAttribute("href", "/auth/signup?plan=plus");
    view.unmount();

    render(
      <Pricing
        mode="landing"
        billingEnabled
        aiInsightsEnabled
        caregiverSharingEnabled
      />,
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(
      screen.getAllByText(/pricingCard.billedYearly/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "pricing.contact" }),
    ).toHaveAttribute("href", "/contact");
    expect(screen.getAllByText("AI insight feature")).not.toHaveLength(0);
    expect(screen.getAllByText("Caregiver sharing feature")).not.toHaveLength(
      0,
    );
  });

  it("states explicitly that checkout is closed while billing is disabled", () => {
    render(<Pricing mode="landing" billingEnabled={false} />);

    expect(
      screen.getByText("pricing.descriptionUnavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("pricing.footerUnavailable")).toBeInTheDocument();
  });
});

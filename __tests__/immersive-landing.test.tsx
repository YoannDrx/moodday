import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "fr" as "fr" | "en" }));
const mocks = vi.hoisted(() => ({
  pricing: vi.fn(),
  getFeatureAvailability: vi.fn((feature: string) => ({
    enabled: feature === "billing",
  })),
}));

vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ locale: state.locale }),
}));
vi.mock("@/components/nowts/moodday-logo", () => ({
  MooddayLogo: () => <span>Moodday</span>,
}));
vi.mock("@/features/i18n/language-toggle", () => ({
  LanguageToggle: () => <button type="button">language</button>,
}));
vi.mock("@/features/theme/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">theme</button>,
}));
vi.mock("@/features/plans/pricing-section", () => ({
  Pricing: (props: {
    mode: string;
    billingEnabled: boolean;
    aiInsightsEnabled: boolean;
    caregiverSharingEnabled: boolean;
  }) => {
    mocks.pricing(props);
    return <div data-testid="pricing">Pricing</div>;
  },
}));
vi.mock("@/lib/public-claims", () => ({
  getActivePublicClaims: () => [
    {
      id: "operational-logs",
      claim: "Journaux techniques minimisés",
      claimEn: "Minimized technical logs",
      reviewedAt: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "caregiver-permissions",
      claim: "Partage aidant contrôlé",
      claimEn: "Controlled caregiver sharing",
      reviewedAt: "2026-08-02T00:00:00.000Z",
    },
    {
      id: "pdf-export",
      claim: "Export contrôlé",
      claimEn: "Controlled export",
      reviewedAt: "2026-08-03T00:00:00.000Z",
    },
  ],
}));
vi.mock("@/lib/features/availability", () => ({
  getFeatureAvailability: mocks.getFeatureAvailability,
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // The mock intentionally mirrors the native semantics of an empty alt.
    <img alt={alt} />
  ),
}));

import HomePage from "@app/page";
import { ImmersiveLanding } from "@/features/landing/immersive-landing";

describe("immersive public landing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
  });

  it("renders the complete factual French proposition and enabled caregiver surface", () => {
    render(
      <ImmersiveLanding
        billingEnabled={true}
        aiInsightsEnabled={true}
        caregiverSharingEnabled={true}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Comprendre vos journées. Préparer vos consultations.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Compagnon de suivi personnel — sans diagnostic ni recommandation médicale.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Partager moins, mais partager juste."),
    ).toBeInTheDocument();
    expect(screen.getByText("Partage aidant contrôlé")).toBeInTheDocument();
    expect(
      screen.getByText("Journaux techniques minimisés"),
    ).toBeInTheDocument();
    expect(screen.getByText("Export contrôlé")).toBeInTheDocument();
    expect(screen.getByTestId("pricing")).toBeInTheDocument();
    expect(mocks.pricing).toHaveBeenCalledWith({
      mode: "landing",
      billingEnabled: true,
      aiInsightsEnabled: true,
      caregiverSharingEnabled: true,
    });
    expect(
      screen.getAllByRole("link", { name: "Commencer gratuitement" }),
    ).not.toHaveLength(0);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Un carnet ouvert devient un horizon doux, avec un repère calendrier et un cœur abricot.",
    );
  });

  it("opens and closes the mobile navigation with accurate ARIA state", async () => {
    const userEventDriver = userEvent.setup();
    render(
      <ImmersiveLanding
        billingEnabled={false}
        aiInsightsEnabled={false}
        caregiverSharingEnabled={true}
      />,
    );

    const menu = screen.getByRole("button", { name: "Menu principal" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    await userEventDriver.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link", { name: "Produit" })).toHaveLength(2);

    await userEventDriver.click(
      screen.getAllByRole("link", { name: "Produit" })[1],
    );
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  it("renders English copy and hides caregiver promises while disabled", () => {
    state.locale = "en";
    render(
      <ImmersiveLanding
        billingEnabled={false}
        aiInsightsEnabled={false}
        caregiverSharingEnabled={false}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Understand your days. Prepare your appointments.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Share less, but share what matters."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Controlled caregiver sharing"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Minimized technical logs")).toBeInTheDocument();
    expect(screen.getByText("Controlled export")).toBeInTheDocument();
    expect(mocks.pricing).toHaveBeenCalledWith({
      mode: "landing",
      billingEnabled: false,
      aiInsightsEnabled: false,
      caregiverSharingEnabled: false,
    });
    expect(
      screen.getByText(
        "Essential tracking stays free. Plus will be offered after final payment validation.",
      ),
    ).toBeInTheDocument();
  });

  it("derives the homepage flags from server availability", () => {
    render(<HomePage />);

    expect(mocks.getFeatureAvailability).toHaveBeenCalledWith("billing");
    expect(mocks.getFeatureAvailability).toHaveBeenCalledWith("aiInsights");
    expect(mocks.getFeatureAvailability).toHaveBeenCalledWith(
      "caregiverSharing",
    );
    expect(mocks.pricing).toHaveBeenCalledWith({
      mode: "landing",
      billingEnabled: true,
      aiInsightsEnabled: false,
      caregiverSharingEnabled: false,
    });
    expect(
      screen.queryByText("Partager moins, mais partager juste."),
    ).not.toBeInTheDocument();
  });
});

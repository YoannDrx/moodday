import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  locale: "fr" as "fr" | "en",
  caregiverSharingEnabled: false,
}));
const translate = (key: string) => key;

vi.mock("@/i18n/server", () => ({
  getI18n: async () => ({
    locale: state.locale,
    t: translate,
  }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: state.locale,
    t: translate,
    tm: () => [],
  }),
}));
vi.mock("@/lib/server-toast", () => ({ serverToast: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) },
}));
vi.mock("next/cache", () => ({
  unstable_cache: (callback: () => Promise<unknown>) => callback,
}));
vi.mock("@/lib/features/availability", () => ({
  getFeatureAvailability: (feature: string) => ({
    enabled: feature === "caregiverSharing" && state.caregiverSharingEnabled,
  }),
}));
vi.mock("@/features/contact/support/contact-support.action", () => ({
  contactSupportAction: vi.fn(),
}));

import AboutPage, {
  generateMetadata as generateAboutMetadata,
} from "@app/(layout)/about/page";
import ContactPage, {
  generateMetadata as generateContactMetadata,
} from "@app/(layout)/contact/page";
import CrisisPage from "@app/(layout)/crisis/page";
import GuidesPage from "@app/(layout)/guides/page";
import HelpPage, {
  generateMetadata as generateHelpMetadata,
} from "@app/(layout)/help/page";
import CookiesPage, {
  generateMetadata as generateCookiesMetadata,
} from "@app/(layout)/legal/cookies/page";
import PrivacyPage, {
  generateMetadata as generatePrivacyMetadata,
} from "@app/(layout)/legal/privacy/page";
import SubprocessorsPage, {
  generateMetadata as generateSubprocessorsMetadata,
} from "@app/(layout)/legal/subprocessors/page";
import TermsPage, {
  generateMetadata as generateTermsMetadata,
} from "@app/(layout)/legal/terms/page";
import StatusPage, {
  generateMetadata as generateStatusMetadata,
} from "@app/(layout)/status/page";

beforeEach(() => {
  state.locale = "fr";
  state.caregiverSharingEnabled = false;
});

describe("public product pages", () => {
  it("renders the factual about, contact and guides surfaces", async () => {
    render(await AboutPage());
    expect(
      screen.getByRole("heading", {
        name: "about.hero.titlePrefix about.hero.titleHighlight",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect((await generateAboutMetadata()).title).toBe("about.metaTitle");

    render(await ContactPage());
    expect(
      screen.getByRole("heading", { name: "contact.title", level: 1 }),
    ).toBeInTheDocument();
    expect((await generateContactMetadata()).title).toBe("contact.metaTitle");

    render(await GuidesPage());
    expect(
      screen.getByRole("heading", { name: "guides.title", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("guides.items.caregivers.title"),
    ).not.toBeInTheDocument();
  });

  it("publishes the caregiver guide only when server availability allows it", async () => {
    state.caregiverSharingEnabled = true;
    render(await GuidesPage());

    expect(
      screen.getByText("guides.items.caregivers.title"),
    ).toBeInTheDocument();
  });

  it("renders localized help and minimal status pages", async () => {
    render(await HelpPage());
    expect(
      screen.getByRole("heading", { name: "Aide Moodday", level: 1 }),
    ).toBeInTheDocument();
    expect((await generateHelpMetadata()).title).toBe("Aide | Moodday");

    render(await StatusPage());
    expect(
      screen.getByRole("heading", { name: "État du service", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Service disponible")).toBeInTheDocument();

    state.locale = "en";
    render(await HelpPage());
    expect(
      screen.getByRole("heading", { name: "Moodday help", level: 1 }),
    ).toBeInTheDocument();
    expect((await generateHelpMetadata()).title).toBe("Help | Moodday");

    render(await StatusPage());
    expect(
      screen.getByRole("heading", { name: "Service status", level: 1 }),
    ).toBeInTheDocument();
    expect((await generateStatusMetadata()).title).toBe(
      "Service status | Moodday",
    );
  });

  it("renders versioned legal pages and their metadata", async () => {
    render(await TermsPage());
    expect(
      screen.getByRole("heading", { name: "legal.terms.title", level: 1 }),
    ).toBeInTheDocument();
    expect((await generateTermsMetadata()).title).toBe("legal.terms.metaTitle");

    render(await CookiesPage());
    expect(
      screen.getByRole("heading", { name: "legal.cookies.title", level: 1 }),
    ).toBeInTheDocument();
    expect((await generateCookiesMetadata()).title).toBe(
      "legal.cookies.metaTitle",
    );

    render(await PrivacyPage());
    expect(
      screen.getByRole("heading", { name: "legal.privacy.title", level: 1 }),
    ).toBeInTheDocument();
    expect((await generatePrivacyMetadata()).title).toBe(
      "legal.privacy.metaTitle",
    );
  });

  it("renders the processor register in both supported locales", async () => {
    render(await SubprocessorsPage());
    expect(
      screen.getByRole("heading", {
        name: "Sous-traitants et destinataires",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect((await generateSubprocessorsMetadata()).title).toContain(
      "Sous-traitants",
    );

    state.locale = "en";
    render(await SubprocessorsPage());
    expect(
      screen.getByRole("heading", {
        name: "Processors and recipients",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect((await generateSubprocessorsMetadata()).title).toContain(
      "Processors",
    );
  });

  it("renders the public crisis resources with callable emergency numbers", async () => {
    render(await CrisisPage());
    expect(
      screen.getAllByRole("link", { name: /3114/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /15/ }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByRole("link", { name: /112/ }).length).toBeGreaterThan(
      0,
    );
  });

  it("renders the English privacy legal-basis table", async () => {
    state.locale = "en";
    render(await PrivacyPage());
    expect(
      screen.getByText("Optional AI insights", { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Article 9\(2\)\(a\)/)).not.toHaveLength(0);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "fr" as "fr" | "en" }));

vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: state.locale,
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </main>
  ),
}));
vi.mock("@/components/nowts/glass-card", () => ({
  GlassCard: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <section onClick={onClick}>{children}</section>,
  GlassCardBadge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  GlassCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GlassCardHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  GlassCardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));
vi.mock("@/components/nowts/mood-chart", () => ({
  MoodChart: ({
    moodEntries,
    dosageChanges,
  }: {
    moodEntries: unknown[];
    dosageChanges: unknown[];
  }) => (
    <div data-testid="trend-chart">
      chart:{moodEntries.length}:{dosageChanges.length}
    </div>
  ),
}));

import { TrendsContent } from "@app/(logged-in)/(patient-layout)/trends/_components/trends-content";

const moodEntry = (
  id: string,
  value: number,
  sleepHours: number | null,
  energy: number | null,
) => ({
  id,
  value,
  note: null,
  sleepHours,
  energy,
  anxiety: null,
  date: `2026-08-${id.padStart(2, "0")}`,
});

const rich7 = {
  moodEntries: [
    moodEntry("1", 8, 5, 3),
    moodEntry("2", 9, 7, 6),
    moodEntry("3", 10, 9, 9),
  ],
  dosageChanges: [
    {
      id: "change-1",
      medicationName: "Traitement",
      previousDosage: null,
      newDosage: "10 mg",
      date: "2026-08-02",
    },
  ],
  medicationAdherence: 0,
};
const rich30 = {
  moodEntries: [
    moodEntry("4", 4, 6, 4),
    moodEntry("5", 5, 6, 4),
    moodEntry("6", 6, 6, 4),
  ],
  dosageChanges: [],
  medicationAdherence: 75,
};
const rich90 = {
  moodEntries: [moodEntry("7", 7, null, null)],
  dosageChanges: [],
  medicationAdherence: null,
};
const insights = [
  { type: "mood" as const, message: "Humeur en hausse", trend: "up" as const },
  {
    type: "medication" as const,
    message: "Adhérence observée",
    trend: "down" as const,
  },
  {
    type: "therapy" as const,
    message: "Séances enregistrées",
    trend: "neutral" as const,
  },
  {
    type: "exercise" as const,
    message: "Activité enregistrée",
    trend: "up" as const,
  },
  {
    type: "mood" as const,
    message: "Cinquième masqué",
    trend: "neutral" as const,
  },
];

describe("trends content", () => {
  beforeEach(() => {
    state.locale = "fr";
  });

  it("renders factual correlations and enforces the Free history and report gates", () => {
    render(
      <TrendsContent
        chartData7={rich7}
        chartData30={rich30}
        chartData90={rich90}
        insights={insights}
        canViewUnlimitedHistory={false}
        canCreateConsultationReport={false}
        billingEnabled
      />,
    );

    expect(screen.getByText("Mode Consultation")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Découvrir Plus/ }),
    ).toHaveAttribute("href", "/pricing");
    expect(screen.getByText("9.0/10")).toBeInTheDocument();
    expect(screen.getByText("5.0/10")).toBeInTheDocument();
    expect(screen.getByText("Plus")).toBeInTheDocument();
    expect(screen.getAllByText("trends.insights.trendUp")).toHaveLength(2);
    expect(screen.getByText("trends.insights.trendDown")).toBeInTheDocument();
    expect(screen.queryByText("Cinquième masqué")).not.toBeInTheDocument();
    expect(
      screen.getByText(/ne démontrent ni cause, ni effet médical/),
    ).toBeInTheDocument();

    const locked90 = screen.getByRole("button", {
      name: /trends\.periods\.days90/,
    });
    expect(locked90).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "trends.periods.days7" }),
    );
    expect(screen.getByTestId("trend-chart")).toHaveTextContent("chart:3:1");
    expect(
      screen.getByText("trends.chart.legend.dosageChange"),
    ).toBeInTheDocument();
  });

  it("allows Plus users to select 90 days and renders English safety copy", () => {
    state.locale = "en";
    render(
      <TrendsContent
        chartData7={{ ...rich7, moodEntries: [moodEntry("1", 2, null, null)] }}
        chartData30={{
          ...rich30,
          moodEntries: [moodEntry("2", 7, null, null)],
        }}
        chartData90={rich90}
        insights={[]}
        canViewUnlimitedHistory
        canCreateConsultationReport
        billingEnabled
      />,
    );

    expect(screen.getByText("Consultation Mode")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Prepare report/ }),
    ).toHaveAttribute("href", "/export");
    expect(
      screen.getByText(/do not establish a cause or medical effect/),
    ).toBeInTheDocument();
    expect(screen.getByText("trends.insights.empty")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "trends.periods.days90" }),
    );
    expect(screen.getByTestId("trend-chart")).toHaveTextContent("chart:1:0");
    expect(screen.getAllByText("trends.periods.days90")).toHaveLength(2);
  });

  it("keeps empty and undefined datasets explicit instead of fabricating metrics", () => {
    render(
      <TrendsContent
        insights={undefined}
        canViewUnlimitedHistory
        canCreateConsultationReport={false}
        billingEnabled={false}
      />,
    );

    expect(screen.getAllByText("--/10")).toHaveLength(3);
    expect(screen.getByTestId("trend-chart")).toHaveTextContent("chart:0:0");
    expect(screen.getAllByText("--")).toHaveLength(3);
    expect(screen.getByText("trends.insights.empty")).toBeInTheDocument();
    expect(
      screen.getByText("PDF indisponible avant l’ouverture de Plus"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Plus/ }),
    ).not.toBeInTheDocument();
  });
});

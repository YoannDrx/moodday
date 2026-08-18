import { fireEvent, render, screen } from "@testing-library/react";
import { Heart, Pill } from "lucide-react";
import { cloneElement, isValidElement, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-slider", () => ({
  Root: ({
    children,
    onValueChange,
    ...props
  }: React.ComponentProps<"div"> & {
    onValueChange?: (value: number[]) => void;
  }) => (
    <div
      {...props}
      role="slider"
      onClick={() => onValueChange?.([7])}
    >
      {children}
    </div>
  ),
  Track: (props: React.ComponentProps<"div">) => <div {...props} />,
  Range: (props: React.ComponentProps<"div">) => <div {...props} />,
  Thumb: (props: React.ComponentProps<"button">) => (
    <button type="button" {...props} />
  ),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div data-testid="mood-line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  ReferenceLine: ({ x }: { x: string }) => (
    <div data-testid="dosage-marker">{x}</div>
  ),
  Tooltip: ({ content }: { content: React.ReactNode }) =>
    isValidElement(content)
      ? cloneElement(content as ReactElement<Record<string, unknown>>, {
          active: true,
          label: "13/08",
          payload: [{ value: 5, payload: { notes: ["journée stable"] } }],
        })
      : null,
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      variants: _variants,
      transition: _transition,
      whileInView: _whileInView,
      viewport: _viewport,
      animate: _animate,
      initial: _initial,
      ...props
    }: React.ComponentProps<"div"> & Record<string, unknown>) => (
      <div data-testid="motion-wrapper" {...props}>{children}</div>
    ),
  },
}));

import { AutomaticPagination } from "@/components/nowts/automatic-pagination";
import { BenefitRating } from "@/components/nowts/benefit-rating";
import { BentoGrid, BentoGridItem } from "@/components/nowts/bentoo";
import { CrisisCard, CrisisCardList } from "@/components/nowts/crisis-card";
import { DosageTimeline } from "@/components/nowts/dosage-timeline";
import { EmergencyFab } from "@/components/nowts/emergency-fab";
import { InsightCard } from "@/components/nowts/insight-card";
import {
  CtaCard,
  EmptyState,
  PageHeader,
  QuickAccessCard,
  SectionTitle,
} from "@/components/nowts/layout-components";
import { MoodChart } from "@/components/nowts/mood-chart";
import { MoodSlider } from "@/components/nowts/mood-slider";
import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { MotionWrapper } from "@/components/nowts/motion-wrapper";
import { StatCard } from "@/components/nowts/stat-card";
import { StreakCard } from "@/components/nowts/streak-card";
import { TagSelector } from "@/components/nowts/tag-selector";

describe("Moodday product widgets", () => {
  it("composes page headers, calls to action and empty states", () => {
    const onHeaderAction = vi.fn();
    const onEmptyAction = vi.fn();
    render(
      <div>
        <PageHeader
          title="Mon journal"
          description="Suivi quotidien"
          action={{ label: "Ajouter", onClick: onHeaderAction, icon: Heart }}
        />
        <PageHeader title="Traitements" action={{ label: "Voir", href: "/medications", icon: Pill }} />
        <CtaCard title="Humeur" description="Saisir mon humeur" href="/mood" icon={Heart} color="success" />
        <QuickAccessCard title="Insights" subtitle="Mes tendances" href="/trends" iconName={"unknown" as "Heart"} />
        <EmptyState title="Aucune donnée" description="Commencez ici" action={{ label: "Créer", onClick: onEmptyAction }} />
        <EmptyState title="Aucun traitement" action={{ label: "Ajouter", href: "/medications/new" }} />
        <SectionTitle title="Cette semaine" seeAllHref="/history" seeAllLabel="Historique" />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    expect(onHeaderAction).toHaveBeenCalledOnce();
    expect(onEmptyAction).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /Historique/ })).toHaveAttribute("href", "/history");
  });

  it("aggregates mood values and annotates dosage changes without exposing empty charts", () => {
    const view = render(
      <MoodChart
        moodEntries={[
          { id: "m1", value: 4, note: "journée stable", date: "2026-08-13T08:00:00Z" },
          { id: "m2", value: 6, note: null, date: "2026-08-13T18:00:00Z" },
        ]}
        dosageChanges={[
          { id: "d1", medicationName: "Traitement A", previousDosage: null, newDosage: "10 mg", date: "2026-08-13T10:00:00Z" },
        ]}
      />,
    );
    expect(screen.getByText("insights.chart.mood: 5/10")).toBeInTheDocument();
    expect(screen.getByText("Traitement A: ? → 10 mg")).toBeInTheDocument();
    expect(screen.getByTestId("dosage-marker")).toHaveTextContent("13/08");

    view.rerender(<MoodChart moodEntries={[]} height={180} />);
    expect(screen.getByText("insights.chart.noData")).toBeInTheDocument();

    view.rerender(
      <MoodChart
        moodEntries={[{ id: "m3", value: 8, note: null, date: "2026-08-14T08:00:00Z" }]}
        showDosageMarkers={false}
        compact
      />,
    );
    expect(screen.queryByTestId("grid")).not.toBeInTheDocument();
  });

  it("tracks mood, tag and benefit inputs with privacy-safe local interactions", () => {
    const onMoodChange = vi.fn();
    const onTagToggle = vi.fn();
    const onRatingChange = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vi.fn(),
    });
    const view = render(
      <div>
        <MoodSlider value={0} onChange={onMoodChange} />
        <TagSelector
          tags={["sleep", "work"]}
          selectedTags={["sleep"]}
          onTagToggle={onTagToggle}
          getLabel={(tag) => `tag:${tag}`}
          getColor={() => "#123456"}
          maxSelections={1}
        />
        <BenefitRating value={2} onChange={onRatingChange} size="lg" />
      </div>,
    );
    const slider = screen.getByRole("slider");
    expect(slider).not.toHaveAttribute("aria-label");
    expect(slider.querySelector("[aria-label]")).toHaveAttribute(
      "aria-label",
      "mood.slider.currentValueAria",
    );
    fireEvent.click(slider);
    fireEvent.click(screen.getByText("tag:sleep"));
    fireEvent.click(screen.getByText("tag:work"));
    const stars = screen.getAllByRole("button").slice(-5);
    fireEvent.mouseEnter(stars[3]);
    fireEvent.click(stars[3]);
    fireEvent.mouseLeave(stars[3].parentElement as HTMLElement);
    expect(onMoodChange).toHaveBeenCalledWith(7);
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
    expect(onTagToggle).toHaveBeenCalledTimes(1);
    expect(onRatingChange).toHaveBeenCalledWith(4);

    view.rerender(<MoodSlider value={10} onChange={onMoodChange} disabled />);
    expect(screen.getByRole("img")).toHaveTextContent("😄");
  });

  it("renders streaks, medication history, statistics and crisis contacts", () => {
    render(
      <div>
        <StreakCard streakDays={30} weekProgress={[1, 0.5, 0, 1, 1, 0, 1]} subtitle="Très bon rythme" />
        <StreakCard streakDays={1} weekProgress={[1]} />
        <DosageTimeline
          history={[
            { id: "h1", dosage: "20 mg", previousDosage: "10 mg", reason: "Ajustement saisi", changedAt: new Date("2026-08-13T10:00:00Z") },
            { id: "h2", dosage: "10 mg", changedAt: new Date("2026-07-01T10:00:00Z") },
          ]}
        />
        <StatCard title="Humeur moyenne" value="6,5" subtitle="Sur 30 jours" icon={Heart} color="info" trend={{ value: 5, label: "vs. mois dernier" }} />
        <StatCard title="Adhérence" value="80 %" icon={Pill} color="danger" trend={{ value: -2, label: "vs. semaine" }} />
        <InsightCard type="mood" message="Tendance stable" trend="neutral" />
        <CrisisCard resource={{ name: "3114", phone: "3114", sms: "3114", url: "https://3114.fr", available: "24/7", description: "Prévention du suicide", category: "hotline" }} />
        <CrisisCardList resources={[{ name: "Urgences", phone: "15", category: "emergency" }, { name: "Soutien", category: "support" }]} />
      </div>,
    );
    expect(screen.getByText("Très bon rythme")).toBeInTheDocument();
    expect(screen.getAllByText("10 mg")[0]?.className).toContain("line-through");
    expect(screen.getByRole("link", { name: "3114" })).toHaveAttribute("href", "tel:3114");
  });

  it("supports pagination boundaries, emergency disclosure, branding and motion", () => {
    const view = render(
      <div>
        <AutomaticPagination currentPage={1} totalPages={10} searchParam="mood" />
        <EmergencyFab />
        <MooddayLogo size="xl" />
        <MooddayLogo size="sm" showText={false} href="" />
        <BentoGrid><BentoGridItem title="Résumé" description="Vue synthétique" icon={<Heart />} header={<span>En-tête</span>} /></BentoGrid>
        <MotionWrapper animation="fadeLeft" inView={false} delay={0.1}>Animated</MotionWrapper>
      </div>,
    );
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("href", "?page=2&q=mood");
    fireEvent.click(screen.getByRole("button", { name: "crisis.fab.needHelp" }));
    expect(screen.getByRole("link", { name: /crisis.fab.call/ })).toHaveAttribute("href", "tel:3114");
    expect(screen.getByTestId("motion-wrapper")).toHaveTextContent("Animated");

    view.rerender(<AutomaticPagination currentPage={8} totalPages={10} paramName="entriesPage" searchParam="stable" />);
    expect(screen.getByRole("link", { name: "7" })).toHaveAttribute("href", "?entriesPage=7&search=stable");
    view.rerender(<AutomaticPagination currentPage={1} totalPages={1} />);
    expect(view.container).toBeEmptyDOMElement();
  });
});

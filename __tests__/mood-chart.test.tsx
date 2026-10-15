import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({ data }: { data: unknown }) => (
    <div data-testid="chart-data">{JSON.stringify(data)}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ locale: "fr", t: (key: string) => key }),
}));
import { MoodChart } from "@/components/nowts/mood-chart";

describe("civil-date mood chart", () => {
  it("groups by the tracked day, not browser timezone or offline import time", () => {
    render(
      <MoodChart
        moodEntries={[
          {
            id: "v2",
            value: 0,
            note: null,
            date: "2026-10-24T10:00:00Z",
            localDate: "2026-10-25",
            source: "check-in",
          },
          {
            id: "journal",
            value: 6,
            note: null,
            date: "2026-10-25T12:00:00Z",
            localDate: "2026-10-25",
            source: "journal",
          },
        ]}
      />,
    );
    expect(
      JSON.parse(screen.getByTestId("chart-data").textContent),
    ).toEqual([
      { date: "25/10", value: 3, notes: [], sources: ["check-in", "journal"] },
    ]);
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BreathingWidget } from "@/components/nowts/breathing-widget";
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
afterEach(() => vi.useRealTimers());
it("runs every breathing phase, pauses and resets without leaving a timer", () => {
  vi.useFakeTimers();
  const view = render(
    <BreathingWidget
      inhaleDuration={2}
      holdDuration={1}
      exhaleDuration={1}
      restDuration={1}
    />,
  );
  fireEvent.click(screen.getByText("breathing.start"));
  expect(screen.getByText("breathing.phases.inhale")).toBeVisible();
  void act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText("1")).toBeVisible();
  for (const phase of ["hold", "exhale", "rest", "inhale"]) {
    void act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(`breathing.phases.${phase}`)).toBeVisible();
  }
  fireEvent.click(screen.getByText("breathing.pause"));
  expect(screen.getByText("breathing.ready")).toBeVisible();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByText("breathing.reset"));
  expect(screen.getByText("breathing.instructions")).toBeVisible();
  fireEvent.click(screen.getByText("breathing.start"));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

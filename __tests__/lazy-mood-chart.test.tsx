import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LazyMoodChart } from "@/components/nowts/lazy-mood-chart";
vi.mock("@/components/nowts/mood-chart", () => ({
  MoodChart: () => <div>Loaded chart</div>,
}));
afterEach(() => vi.unstubAllGlobals());
it("loads on visibility and disconnects the observer", async () => {
  let callback: IntersectionObserverCallback;
  const disconnect = vi.fn();
  const observe = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function (handler: IntersectionObserverCallback) {
      callback = handler;
      return { observe, disconnect };
    }),
  );
  const view = render(<LazyMoodChart moodEntries={[]} />);
  expect(observe).toHaveBeenCalledOnce();
  act(() =>
    callback(
      [{ isIntersecting: false }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    ),
  );
  expect(screen.queryByText("Loaded chart")).toBeNull();
  act(() =>
    callback(
      [{ isIntersecting: true }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    ),
  );
  await waitFor(() => expect(screen.getByText("Loaded chart")).toBeVisible());
  expect(disconnect).toHaveBeenCalled();
  view.unmount();
});
it("still loads when observers are unavailable", async () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  render(<LazyMoodChart moodEntries={[]} />);
  await waitFor(() => expect(screen.getByText("Loaded chart")).toBeVisible());
});

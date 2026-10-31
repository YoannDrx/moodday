/* eslint-disable @next/next/no-html-link-for-pages */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as progress from "nprogress";
import {
  NextTopLoader,
  stopLoading,
  useNextTopLoaderStore,
} from "@/features/page/next-top-loader";
vi.mock("nprogress", () => ({
  configure: vi.fn(),
  start: vi.fn(),
  done: vi.fn(),
}));
const preventNavigation = (event: Event) => event.preventDefault();
const originalPushState = window.history.pushState;
beforeEach(() => {
  document.addEventListener("click", preventNavigation, true);
  window.location.href = "http://localhost:3000/current";
  vi.useFakeTimers();
  vi.clearAllMocks();
  useNextTopLoaderStore.getState().enable();
});
afterEach(() => {
  document.removeEventListener("click", preventNavigation, true);
  window.history.pushState = originalPushState;
  vi.useRealTimers();
});
it("starts after a slow navigation and completes when the router commits", () => {
  const view = render(
    <>
      <NextTopLoader />
      <a
        rel="noreferrer"
        onClick={(event) => event.preventDefault()}
        href="/next"
      >
        <span>Next</span>
      </a>
    </>,
  );
  fireEvent.click(view.getByText("Next"));
  expect(progress.start).not.toHaveBeenCalled();
  void act(() => vi.advanceTimersByTime(100));
  expect(progress.start).toHaveBeenCalledOnce();
  document.documentElement.classList.add("nprogress-busy");
  act(() => window.history.pushState({}, "", "/committed"));
  expect(progress.done).toHaveBeenCalledOnce();
  expect(document.documentElement).not.toHaveClass("nprogress-busy");
  view.unmount();
});
it("avoids flashing a bar after an already completed navigation", () => {
  const view = render(
    <>
      <NextTopLoader />
      <a
        rel="noreferrer"
        onClick={(event) => event.preventDefault()}
        href="/fast"
      >
        Fast
      </a>
    </>,
  );
  fireEvent.click(view.getByText("Fast"));
  act(() => window.history.pushState({}, "", "/fast"));
  void act(() => vi.advanceTimersByTime(101));
  expect(progress.start).not.toHaveBeenCalled();
});
it.each(["same", "hash", "external"])(
  "finishes a %s link immediately",
  (kind) => {
    const href =
      kind === "same"
        ? window.location.href
        : kind === "hash"
          ? `${window.location.href}#section`
          : "https://example.invalid";
    const view = render(
      <>
        <NextTopLoader shadow={false} />
        <a
          rel="noreferrer"
          onClick={(event) => event.preventDefault()}
          href={href}
          target={kind === "external" ? "_blank" : undefined}
        >
          Link
        </a>
      </>,
    );
    fireEvent.click(view.getByText("Link"));
    expect(progress.done).toHaveBeenCalledOnce();
  },
);
it("respects disabled and modified clicks and a delayed quick navigation", () => {
  const view = render(
    <>
      <NextTopLoader shadow="none" delay={200} />
      <a
        rel="noreferrer"
        onClick={(event) => event.preventDefault()}
        href="/ignored"
        data-toploader-disabled="true"
      >
        Disabled
      </a>
      <a
        rel="noreferrer"
        onClick={(event) => event.preventDefault()}
        href="/other"
      >
        Other
      </a>
      <a
        rel="noreferrer"
        onClick={(event) => event.preventDefault()}
        href="#anchor"
      >
        Anchor
      </a>
    </>,
  );
  fireEvent.click(view.getByText("Disabled"));
  fireEvent.click(view.getByText("Other"), { ctrlKey: true });
  fireEvent.click(view.getByText("Other"), { metaKey: true });
  useNextTopLoaderStore.getState().disable();
  fireEvent.click(view.getByText("Other"));
  useNextTopLoaderStore.getState().enable();
  fireEvent.click(document.body);
  fireEvent.click(view.getByText("Anchor"));
  void act(() => vi.advanceTimersByTime(300));
  expect(progress.start).not.toHaveBeenCalled();
  act(() => {
    stopLoading();
    vi.advanceTimersByTime(100);
  });
  expect(progress.done).toHaveBeenCalledOnce();
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMobileSessionInvalidation,
  invalidateMobileSession,
  isMobileSessionInvalidated,
  subscribeToMobileSessionInvalidation,
} from "../apps/mobile/src/lib/session-security";

describe("mobile session invalidation signal", () => {
  afterEach(() => {
    clearMobileSessionInvalidation();
    vi.useRealTimers();
  });

  it("fails closed immediately and notifies the lock boundary after cleanup", () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    const unsubscribe = subscribeToMobileSessionInvalidation(listener);

    invalidateMobileSession();
    invalidateMobileSession();

    expect(isMobileSessionInvalidated()).toBe(true);
    expect(listener).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});

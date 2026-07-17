import {
  getOfflineFailureStatus,
  getOfflineStorageErrorMessage,
  isOfflineStorageQuotaError,
  OfflineStorageQuotaError,
} from "@/features/pwa/offline-store";
import { describe, expect, it } from "vitest";

describe("offline storage quota errors", () => {
  it.each([
    new OfflineStorageQuotaError(),
    { name: "QuotaExceededError" },
    { name: "NS_ERROR_DOM_QUOTA_REACHED" },
    { code: 22 },
    { code: 1014 },
  ])("recognizes browser quota variants", (error) => {
    expect(isOfflineStorageQuotaError(error)).toBe(true);
  });

  it("returns the localized recovery message for quota errors", () => {
    expect(
      getOfflineStorageErrorMessage(
        new DOMException("Storage full", "QuotaExceededError"),
        { quota: "Reconnect and synchronize", fallback: "Try again" },
      ),
    ).toBe("Reconnect and synchronize");
  });

  it("preserves non-quota errors", () => {
    expect(
      getOfflineStorageErrorMessage(new Error("Server unavailable"), {
        quota: "Reconnect and synchronize",
        fallback: "Try again",
      }),
    ).toBe("Server unavailable");
  });

  it("separates user-resolvable conflicts from transient failures", () => {
    expect(getOfflineFailureStatus("Mood entry not found")).toBe("conflict");
    expect(
      getOfflineFailureStatus("You can only edit your own mood entries"),
    ).toBe("conflict");
    expect(getOfflineFailureStatus("Server unavailable")).toBe("failed");
  });
});

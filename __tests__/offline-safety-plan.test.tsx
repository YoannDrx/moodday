import { act, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  getActiveOfflineOwner,
  getEncryptedOfflineSnapshot,
} from "@/features/pwa/offline-store";
import { OfflineSafetyPlan } from "@/features/safety-plan/offline-safety-plan";
vi.mock("@/features/pwa/offline-store", () => ({
  getActiveOfflineOwner: vi.fn(),
  getEncryptedOfflineSnapshot: vi.fn(),
}));
const snapshot = {
  warningSigns: ["Signal privé"],
  copingStrategies: ["Marcher"],
  safePlaces: ["Jardin"],
  trustedContacts: [{ name: "Proche", detail: "Synthetic" }],
  professionalContacts: [],
  lastReviewedAt: null,
};
it("hides a previous account immediately and ignores its late decryption", async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(getActiveOfflineOwner).mockReturnValue("owner-a");
  vi.mocked(getEncryptedOfflineSnapshot).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const view = render(<OfflineSafetyPlan />);
  vi.mocked(getActiveOfflineOwner).mockReturnValue("owner-b");
  vi.mocked(getEncryptedOfflineSnapshot).mockResolvedValueOnce({
    ...snapshot,
    warningSigns: ["Owner B"],
  });
  act(() => {
    window.dispatchEvent(new Event("moodday:offline-owner-changed"));
  });
  await waitFor(() => expect(screen.getByText("Owner B")).toBeVisible());
  await act(async () => {
    resolve(snapshot);
  });
  expect(screen.queryByText("Signal privé")).toBeNull();
  expect(screen.getByText("Owner B")).toBeVisible();
  vi.mocked(getActiveOfflineOwner).mockReturnValue(null);
  act(() => {
    window.dispatchEvent(new Event("moodday:offline-owner-changed"));
  });
  expect(screen.queryByText("Owner B")).toBeNull();
  view.unmount();
});
it("tolerates missing or unreadable snapshots", async () => {
  vi.mocked(getActiveOfflineOwner).mockReturnValue("owner");
  vi.mocked(getEncryptedOfflineSnapshot).mockRejectedValueOnce(
    new Error("missing key"),
  );
  render(<OfflineSafetyPlan />);
  await act(async () => undefined);
  expect(screen.queryByRole("heading")).toBeNull();
  vi.mocked(getEncryptedOfflineSnapshot).mockResolvedValueOnce({
    ...snapshot,
    warningSigns: [],
    copingStrategies: [],
    safePlaces: [],
    trustedContacts: [],
  });
  act(() => {
    window.dispatchEvent(new Event("moodday:offline-owner-changed"));
  });
  await waitFor(() =>
    expect(screen.getByText("Mon plan de sécurité personnel")).toBeVisible(),
  );
  expect(screen.queryByText("Mes contacts")).toBeNull();
});

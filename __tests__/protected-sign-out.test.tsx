import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: { user: { id: "user-alice" } } as { user: { id: string } } | null,
  count: vi.fn(),
  mayHave: vi.fn(),
  purgeOffline: vi.fn(),
  setOwner: vi.fn(),
  purgeCaches: vi.fn(),
  unsubscribe: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: mocks.session }),
}));
vi.mock("@/features/pwa/offline-store", () => ({
  countOfflineOperations: mocks.count,
  mayHaveOfflineOperations: mocks.mayHave,
  purgeOfflineDataForOwner: mocks.purgeOffline,
  setActiveOfflineOwner: mocks.setOwner,
}));
vi.mock("@/features/pwa/push-client", () => ({
  purgeAuthenticatedBrowserCaches: mocks.purgeCaches,
  unsubscribeCurrentPush: mocks.unsubscribe,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import { useProtectedSignOut } from "@/features/auth/use-protected-sign-out";

function SignOutHarness() {
  const signOut = useProtectedSignOut();
  return (
    <>
      <button type="button" onClick={() => void signOut.requestSignOut()}>
        sign-out
      </button>
      <output>{signOut.isPending ? "pending" : "idle"}</output>
      {signOut.dialog}
    </>
  );
}

describe("protected sign-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document
      .querySelectorAll('form[action^="/api/auth/logout"]')
      .forEach((form) => form.remove());
    window.localStorage.clear();
    mocks.session = { user: { id: "user-alice" } };
    mocks.mayHave.mockReturnValue(false);
    mocks.count.mockResolvedValue(0);
    mocks.purgeOffline.mockResolvedValue(undefined);
    mocks.purgeCaches.mockResolvedValue(undefined);
    mocks.unsubscribe.mockResolvedValue(undefined);
    vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(
      () => undefined,
    );
  });

  it("submits a POST logout intent after clearing device-bound state", async () => {
    window.localStorage.setItem("moodday.push.device-id", "device id/1");
    render(<SignOutHarness />);
    fireEvent.click(screen.getByRole("button", { name: "sign-out" }));
    await waitFor(() =>
      expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalled(),
    );
    const form = document.querySelector<HTMLFormElement>(
      'form[action^="/api/auth/logout"]',
    );
    expect(form).toHaveAttribute("method", "POST");
    expect(form?.getAttribute("action")).toContain(
      "deviceId=device%20id%2F1",
    );
    expect(
      form?.querySelector<HTMLInputElement>('input[name="intent"]'),
    ).toHaveValue("sign-out");
    expect(mocks.unsubscribe).toHaveBeenCalled();
    expect(mocks.setOwner).toHaveBeenCalledWith();
    expect(mocks.purgeCaches).toHaveBeenCalled();
    expect(mocks.purgeOffline).not.toHaveBeenCalled();
  });

  it("blocks silent logout when encrypted offline operations remain", async () => {
    mocks.mayHave.mockReturnValue(true);
    mocks.count.mockResolvedValue(2);
    render(<SignOutHarness />);
    fireEvent.click(screen.getByRole("button", { name: "sign-out" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("2 item(s)");
    expect(HTMLFormElement.prototype.requestSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete and sign out" }));
    await waitFor(() => expect(mocks.purgeOffline).toHaveBeenCalledWith("user-alice"));
    expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalled();
  });

  it("cancels logout when queue inspection fails", async () => {
    mocks.mayHave.mockReturnValue(true);
    mocks.count.mockRejectedValue(new Error("indexeddb unavailable"));
    render(<SignOutHarness />);
    fireEvent.click(screen.getByRole("button", { name: "sign-out" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(
      "Unable to verify the offline queue. Sign-out was cancelled.",
    ));
    expect(HTMLFormElement.prototype.requestSubmit).not.toHaveBeenCalled();
  });

  it("does not share or submit data when the explicit purge fails", async () => {
    mocks.mayHave.mockReturnValue(true);
    mocks.count.mockResolvedValue(1);
    mocks.purgeOffline.mockRejectedValue(new Error("purge failed"));
    render(<SignOutHarness />);
    fireEvent.click(screen.getByRole("button", { name: "sign-out" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete and sign out" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(
      "Sign-out could not be completed. Your offline data was not shared.",
    ));
    expect(HTMLFormElement.prototype.requestSubmit).not.toHaveBeenCalled();
  });
});

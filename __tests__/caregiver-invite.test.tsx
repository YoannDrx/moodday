import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: { data: undefined, isLoading: false, isError: false } as {
    data?: { status: string; patientName?: string };
    isLoading: boolean;
    isError: boolean;
  },
  accept: vi.fn(),
  decline: vi.fn(),
  getInfo: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/features/caregiver/caregiver.action", () => ({
  acceptCaregiverInvitation: mocks.accept,
  declineCaregiverInvitation: mocks.decline,
  getCaregiverInviteInfo: mocks.getInfo,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => mocks.query,
  useMutation: (options: {
    mutationFn: () => Promise<unknown>;
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: () => {
      void options.mutationFn()
        .then((data) => options.onSuccess?.(data))
        .catch((error: Error) => options.onError?.(error));
    },
  }),
}));

import { CaregiverInvite } from "@app/invite/caregiver/_components/caregiver-invite";

describe("caregiver invitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query = { data: undefined, isLoading: false, isError: false };
    mocks.accept.mockResolvedValue({ data: { status: "active" } });
    mocks.decline.mockResolvedValue({ data: { status: "declined" } });
  });

  it("renders safe not-found and authentication gates", () => {
    const view = render(<CaregiverInvite token="" isAuthenticated={false} />);
    expect(screen.getByRole("heading", { name: "caregiver.invite.notFoundTitle" })).toBeInTheDocument();

    view.rerender(<CaregiverInvite token="invite-token" isAuthenticated={false} />);
    expect(screen.getByRole("heading", { name: "caregiver.invite.signInRequiredTitle" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=/invite/caregiver?token=invite-token",
    );
  });

  it("accepts and declines a pending invitation through server-derived identity", async () => {
    mocks.query = {
      data: { status: "pending", patientName: "Alice" },
      isLoading: false,
      isError: false,
    };
    const view = render(<CaregiverInvite token="invite-token" isAuthenticated />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "caregiver.invite.accept" }));
    await waitFor(() => expect(mocks.accept).toHaveBeenCalledWith({ inviteToken: "invite-token" }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("caregiver.invite.accepted");
    expect(mocks.push).toHaveBeenCalledWith("/caregiver");

    mocks.push.mockClear();
    view.rerender(<CaregiverInvite token="invite-token" isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: "caregiver.invite.decline" }));
    await waitFor(() => expect(mocks.decline).toHaveBeenCalledWith({ inviteToken: "invite-token" }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("caregiver.invite.declined");
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows loading, invalid, active and declined terminal states", () => {
    mocks.query = { data: undefined, isLoading: true, isError: false };
    const view = render(<CaregiverInvite token="invite-token" isAuthenticated />);
    expect(screen.getByText("caregiver.invite.loading")).toBeInTheDocument();

    mocks.query = { data: undefined, isLoading: false, isError: true };
    view.rerender(<CaregiverInvite token="invite-token" isAuthenticated />);
    expect(screen.getByText("caregiver.invite.invalid")).toBeInTheDocument();

    mocks.query = { data: { status: "active" }, isLoading: false, isError: false };
    view.rerender(<CaregiverInvite token="invite-token" isAuthenticated />);
    expect(screen.getByText("caregiver.invite.alreadyAccepted")).toBeInTheDocument();

    mocks.query = { data: { status: "declined" }, isLoading: false, isError: false };
    view.rerender(<CaregiverInvite token="invite-token" isAuthenticated />);
    expect(screen.getByText("caregiver.invite.alreadyDeclined")).toBeInTheDocument();
  });

  it("surfaces accept and decline failures without navigating", async () => {
    mocks.query = {
      data: { status: "pending", patientName: "Alice" },
      isLoading: false,
      isError: false,
    };
    mocks.accept.mockResolvedValueOnce({ serverError: "email mismatch" });
    mocks.decline.mockResolvedValueOnce({ serverError: "invitation expired" });
    render(<CaregiverInvite token="invite-token" isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: "caregiver.invite.accept" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("email mismatch"));
    fireEvent.click(screen.getByRole("button", { name: "caregiver.invite.decline" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("invitation expired"));
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

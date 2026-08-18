import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tab: null as string | null,
  session: { user: { id: "caregiver-1" } } as { user: { id: string } } | null,
  sessionPending: false,
  patientsLoading: false,
  patients: [] as {
    id: string;
    patientId: string;
    patientName: string;
  }[],
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (key: string) => key === "tab" ? mocks.tab : null }),
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mocks.patients, isLoading: mocks.patientsLoading }),
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: mocks.session, isPending: mocks.sessionPending }),
}));
vi.mock("@/features/caregiver/caregiver.action", () => ({
  getMyPatients: vi.fn(),
}));
vi.mock("@/features/caregiver/caregiver-checkin-form", () => ({
  CaregiverCheckinForm: ({ relationshipId, subjectName, onSuccess }: {
    relationshipId: string;
    subjectName: string;
    onSuccess: () => void;
  }) => (
    <button type="button" onClick={onSuccess}>
      checkin:{relationshipId}:{subjectName}
    </button>
  ),
}));
vi.mock("@/features/caregiver/caregiver-event-form", () => ({
  CaregiverEventForm: ({ relationshipId, subjectName, onSuccess }: {
    relationshipId: string;
    subjectName: string;
    onSuccess: () => void;
  }) => (
    <button type="button" onClick={onSuccess}>
      event:{relationshipId}:{subjectName}
    </button>
  ),
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="patient-select"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

import ObservePage from "@app/(logged-in)/(patient-layout)/caregiver/observe/page";

describe("caregiver observation page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tab = null;
    mocks.session = { user: { id: "caregiver-1" } };
    mocks.sessionPending = false;
    mocks.patientsLoading = false;
    mocks.patients = [];
  });

  it("renders loading and unauthenticated safety states", () => {
    mocks.sessionPending = true;
    const view = render(<ObservePage />);
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

    mocks.sessionPending = false;
    mocks.session = null;
    view.rerender(<ObservePage />);
    expect(screen.getByText("auth.notSignedIn")).toBeInTheDocument();
  });

  it("shows an empty relationship state without exposing any patient form", () => {
    render(<ObservePage />);
    expect(screen.getByText("caregiver.observe.emptyTitle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /actions.back/ })).toHaveAttribute("href", "/caregiver");
    expect(screen.queryByText(/checkin:/)).not.toBeInTheDocument();
  });

  it("derives the relationship from the selected patient and returns on success", async () => {
    mocks.patients = [
      { id: "relationship-a", patientId: "patient-a", patientName: "Alice" },
      { id: "relationship-b", patientId: "patient-b", patientName: "Bob" },
    ];
    render(<ObservePage />);
    await waitFor(() => expect(screen.getByText("checkin:relationship-a:Alice")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("patient-select"), {
      target: { value: "patient-b" },
    });
    await waitFor(() => expect(screen.getByText("checkin:relationship-b:Bob")).toBeInTheDocument());
    fireEvent.click(screen.getByText("checkin:relationship-b:Bob"));
    expect(mocks.push).toHaveBeenCalledWith("/caregiver");
  });

  it("opens the event workflow from the URL and can switch tabs", async () => {
    mocks.tab = "event";
    mocks.patients = [
      { id: "relationship-a", patientId: "patient-a", patientName: "Alice" },
    ];
    render(<ObservePage />);
    await waitFor(() => expect(screen.getByText("event:relationship-a:Alice")).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole("tab", { name: /caregiver.observe.tabCheckin/ }));
    await waitFor(() => expect(screen.getByText("checkin:relationship-a:Alice")).toBeInTheDocument());
  });
});

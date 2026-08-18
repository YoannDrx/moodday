import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "rich" as "rich" | "empty" | "loading" | "error",
}));
const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  deleteTherapySession: vi.fn(),
  updateTherapySession: vi.fn(),
}));

const sessions = [
  {
    id: "session-high",
    date: new Date("2026-08-10T22:00:00.000Z"),
    notes: "Séance utile",
    benefitRating: 5,
  },
  {
    id: "session-neutral",
    date: "2026-08-05T10:00:00.000Z",
    notes: "Séance sans note de bénéfice",
    benefitRating: null,
  },
];

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: () => ({
    data:
      state.mode === "empty"
        ? { sessions: [], timezone: "Invalid/Timezone" }
        : { sessions, timezone: "Europe/Paris" },
    isLoading: state.mode === "loading",
    isError: state.mode === "error",
  }),
  useMutation: (options: {
    mutationFn: (variables: never) => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onError: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: (variables: never) => {
      void options
        .mutationFn(variables)
        .then(options.onSuccess)
        .catch(options.onError);
    },
  }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: "fr",
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/features/therapy/therapy.action", () => ({
  getTherapySessions: vi.fn(),
  deleteTherapySession: mocks.deleteTherapySession,
  updateTherapySession: mocks.updateTherapySession,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));
vi.mock("@/components/nowts/glass-card", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  GlassCardBadge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  GlassCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GlassCardHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  GlassCardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));
vi.mock("@/components/nowts/benefit-rating", () => ({
  BenefitRating: ({
    value,
    onChange,
  }: {
    value: number;
    onChange?: (value: number) => void;
  }) => (
    <button
      type="button"
      data-testid={`benefit-${value}`}
      onClick={() => onChange?.(3)}
    >
      benefit:{value}
    </button>
  ),
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" data-testid="delete-session" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <footer>{children}</footer>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <footer>{children}</footer>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
}));

import { TherapySessionList } from "@app/(logged-in)/(patient-layout)/therapy/_components/therapy-session-list";

describe("therapy session list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.mode = "rich";
    mocks.deleteTherapySession.mockResolvedValue({ data: { id: "deleted" } });
    mocks.updateTherapySession.mockResolvedValue({ data: { id: "updated" } });
  });

  it("renders benefit states and updates and deletes owned sessions", async () => {
    render(<TherapySessionList />);
    expect(screen.getByText("Séance utile")).toBeInTheDocument();
    expect(
      screen.getByText("Séance sans note de bénéfice"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("benefit-5")).toHaveLength(1);

    const editButtons = screen
      .getAllByRole("button")
      .filter((button) => button.querySelector(".lucide-pencil"));
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByLabelText("therapy.form.date"), {
      target: { value: "2026-08-09" },
    });
    fireEvent.change(screen.getByLabelText("therapy.form.notes"), {
      target: { value: "Séance corrigée" },
    });
    fireEvent.click(screen.getAllByTestId("benefit-5").at(-1) as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));

    await waitFor(() =>
      expect(mocks.updateTherapySession).toHaveBeenCalledWith({
        id: "session-high",
        date: "2026-08-09",
        notes: "Séance corrigée",
        benefitRating: 3,
      }),
    );

    fireEvent.click(screen.getAllByTestId("delete-session")[1]);
    await waitFor(() =>
      expect(mocks.deleteTherapySession).toHaveBeenCalledWith({
        id: "session-neutral",
      }),
    );
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["therapySessions"],
    });
  });

  it("supports editing a string date and reports stable mutation errors", async () => {
    mocks.updateTherapySession.mockResolvedValue({
      serverError: "Update refused",
    });
    mocks.deleteTherapySession.mockResolvedValue({
      serverError: "Delete refused",
    });
    render(<TherapySessionList />);
    const editButtons = screen
      .getAllByRole("button")
      .filter((button) => button.querySelector(".lucide-pencil"));
    fireEvent.click(editButtons[1]);
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    fireEvent.click(screen.getAllByTestId("delete-session")[0]);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(2));
    expect(mocks.toastError).toHaveBeenCalledWith("Update refused");
    expect(mocks.toastError).toHaveBeenCalledWith("Delete refused");
  });

  it.each([
    ["loading", "therapy.list.title"],
    ["empty", "therapy.list.emptyTitle"],
    ["error", "common.error"],
  ] as const)("renders the %s state", (mode, expected) => {
    state.mode = mode;
    render(<TherapySessionList />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "rich" as "rich" | "empty" | "loading" | "error",
  online: true,
}));
const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  queueAction: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  logExerciseCompletion: vi.fn(),
  archiveExercise: vi.fn(),
  unarchiveExercise: vi.fn(),
  updateExercise: vi.fn(),
}));

const exercises = [
  {
    id: "exercise-empty",
    name: "Respiration",
    description: "Quatre minutes",
    isArchived: false,
    logs: [],
  },
  {
    id: "exercise-done",
    name: "Marche",
    description: null,
    isArchived: false,
    logs: [{ id: "log-a" }, { id: "log-b" }],
  },
  {
    id: "exercise-archived",
    name: "Ancien exercice",
    description: null,
    isArchived: true,
    logs: [],
  },
];

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: () => ({
    data: state.mode === "empty" ? [] : exercises,
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
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "exercise-owner" } } }),
}));
vi.mock("@/features/pwa/offline-actions", () => ({
  queueAction: mocks.queueAction,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  getOfflineStorageErrorMessage: () => "offline-storage-error",
}));
vi.mock("@/features/exercise/exercise.action", () => ({
  getExercises: vi.fn(),
  logExerciseCompletion: mocks.logExerciseCompletion,
  archiveExercise: mocks.archiveExercise,
  unarchiveExercise: mocks.unarchiveExercise,
  updateExercise: mocks.updateExercise,
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
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      archive-switch
    </button>
  ),
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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
    <button type="button" data-testid="archive-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
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

import { ExerciseList } from "@app/(logged-in)/(patient-layout)/exercises/_components/exercise-list";

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
  state.online = online;
};

describe("exercise list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.mode = "rich";
    setOnline(true);
    mocks.queueAction.mockResolvedValue(undefined);
    mocks.logExerciseCompletion.mockResolvedValue({ data: { id: "log-new" } });
    mocks.archiveExercise.mockResolvedValue({ data: { id: "exercise-empty" } });
    mocks.unarchiveExercise.mockResolvedValue({
      data: { id: "exercise-archived" },
    });
    mocks.updateExercise.mockResolvedValue({ data: { id: "exercise-empty" } });
  });

  it("logs, edits, archives and restores exercises through tested UI controls", async () => {
    render(<ExerciseList />);
    expect(screen.getByText("Respiration")).toBeInTheDocument();
    expect(screen.getByText("Marche")).toBeInTheDocument();
    expect(
      screen.getByText('exercise.log.todayCount:{"count":2}'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("exercise.log.button")[0]);
    fireEvent.click(screen.getAllByTestId("archive-action")[0]);
    await waitFor(() => {
      expect(mocks.logExerciseCompletion).toHaveBeenCalledWith({
        exerciseId: "exercise-empty",
      });
      expect(mocks.archiveExercise).toHaveBeenCalledWith({
        id: "exercise-empty",
      });
    });

    fireEvent.click(screen.getAllByText("actions.edit")[0]);
    fireEvent.change(screen.getByLabelText("exercise.form.name"), {
      target: { value: "Respiration lente" },
    });
    fireEvent.change(screen.getByLabelText("exercise.form.description"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() =>
      expect(mocks.updateExercise).toHaveBeenCalledWith({
        id: "exercise-empty",
        name: "Respiration lente",
        description: null,
      }),
    );

    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByText("Ancien exercice")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /exercise\.unarchive\.button/ }),
    );
    await waitFor(() =>
      expect(mocks.unarchiveExercise).toHaveBeenCalledWith({
        id: "exercise-archived",
      }),
    );
  });

  it("queues exercise completions under the current account while offline", async () => {
    setOnline(false);
    render(<ExerciseList />);
    fireEvent.click(screen.getAllByText("exercise.log.button")[0]);
    await waitFor(() =>
      expect(mocks.queueAction).toHaveBeenCalledWith("exercise-owner", {
        type: "exercise_log",
        exerciseId: "exercise-empty",
      }),
    );
    expect(mocks.logExerciseCompletion).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("exercise.log.logged");
  });

  it("maps mutation failures to the expected user-safe errors", async () => {
    mocks.logExerciseCompletion.mockResolvedValue({
      serverError: "log failed",
    });
    mocks.archiveExercise.mockResolvedValue({ serverError: "archive failed" });
    render(<ExerciseList />);
    fireEvent.click(screen.getAllByText("exercise.log.button")[0]);
    fireEvent.click(screen.getAllByTestId("archive-action")[0]);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(2));
    expect(mocks.toastError).toHaveBeenCalledWith("offline-storage-error");
    expect(mocks.toastError).toHaveBeenCalledWith("archive failed");
  });

  it.each([
    ["loading", "exercise.list.title"],
    ["empty", "exercise.list.emptyTitle"],
    ["error", "common.error"],
  ] as const)("renders the %s state", (mode, expected) => {
    state.mode = mode;
    render(<ExerciseList />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

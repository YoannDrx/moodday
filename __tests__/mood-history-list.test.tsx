import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  locale: "fr" as "fr" | "en",
  mode: "rich" as "rich" | "empty" | "loading" | "error",
  queryFn: undefined as undefined | (() => Promise<unknown>),
  lastQueryKey: [] as unknown[],
}));
const mocks = vi.hoisted(() => ({
  openForEdit: vi.fn(),
  saveMoodTagDefinition: vi.fn(),
  searchJournal: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const entries = Array.from({ length: 30 }, (_, index) => ({
  id: `entry-${index}`,
  value: index < 11 ? index : 5,
  note: index === 0 ? "Note synthétique" : null,
  tags: index === 1 ? ["protective", "context"] : [],
  createdAt: new Date(
    index < 15
      ? `2026-08-${String((index % 13) + 1).padStart(2, "0")}T08:00:00.000Z`
      : `2026-07-${String((index % 13) + 1).padStart(2, "0")}T08:00:00.000Z`,
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: {
    queryKey: unknown[];
    queryFn: () => Promise<unknown>;
  }) => {
    state.queryFn = options.queryFn;
    state.lastQueryKey = options.queryKey;
    return {
      data:
        state.mode === "empty"
          ? { entries: [], timezone: "Invalid/Timezone" }
          : { entries, timezone: "Europe/Paris" },
      isLoading: state.mode === "loading",
      isError: state.mode === "error",
      isFetching: false,
    };
  },
}));
vi.mock("@/features/mood/journal-search.action", () => ({
  saveMoodTagDefinition: mocks.saveMoodTagDefinition,
  searchJournal: mocks.searchJournal,
}));
vi.mock("@/features/mood/quick-entry-store", () => ({
  useQuickEntryStore: () => ({ openForEdit: mocks.openForEdit }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ locale: state.locale }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { MoodHistoryList } from "@app/(logged-in)/(patient-layout)/mood/history/_components/mood-history-list";

const getQueryFn = () => {
  if (!state.queryFn) throw new Error("Expected the journal query function");
  return state.queryFn;
};

describe("mood history list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    state.mode = "rich";
    mocks.searchJournal.mockResolvedValue({
      data: { entries, timezone: "Europe/Paris" },
    });
    mocks.saveMoodTagDefinition.mockResolvedValue({
      data: {
        id: "tag-saved",
        displayLabel: "Marche",
        category: "protective",
        color: null,
      },
    });
  });

  it("renders all mood scales, opens entries, paginates and switches calendar groups", () => {
    render(
      <MoodHistoryList
        initialCustomTags={[
          {
            id: "tag-existing",
            displayLabel: "Travail",
            category: "context",
            color: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Travail · context")).toBeInTheDocument();
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(screen.getByText("10/10")).toBeInTheDocument();
    expect(screen.getByText("Note synthétique")).toBeInTheDocument();
    expect(screen.getByText("protective · context")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Note synthétique"));
    expect(mocks.openForEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "entry-0", value: 0 }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(state.lastQueryKey.at(-1)).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: /Précédent/ }));
    expect(screen.getByText("Page 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Calendrier/ }));
    expect(screen.getByRole("button", { name: /Liste/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/août 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/juillet 2026/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /0\/10/ })[0]);
    expect(mocks.openForEdit).toHaveBeenCalledTimes(2);
  });

  it("normalizes filter inputs before invoking the bounded server search", async () => {
    render(<MoodHistoryList initialCustomTags={[]} />);
    fireEvent.change(screen.getByLabelText("Recherche dans les notes"), {
      target: { value: "sommeil" },
    });
    fireEvent.change(screen.getByLabelText(/Tags/), {
      target: { value: " protective, context, , trigger " },
    });
    fireEvent.change(screen.getByLabelText("Humeur min."), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Humeur max."), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByLabelText("Du"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.change(screen.getByLabelText("Au"), {
      target: { value: "2026-08-13" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Appliquer/ }));

    await getQueryFn()();
    expect(mocks.searchJournal).toHaveBeenCalledWith({
      query: "sommeil",
      tags: ["protective", "context", "trigger"],
      moodMin: 0,
      moodMax: 8,
      start: "2026-08-01",
      end: "2026-08-13",
      page: 1,
      pageSize: 30,
    });

    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    await getQueryFn()();
    expect(mocks.searchJournal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: "",
        tags: [],
        moodMin: undefined,
        moodMax: undefined,
        start: undefined,
        end: undefined,
      }),
    );
  });

  it("creates and replaces a normalized custom tag", async () => {
    render(
      <MoodHistoryList
        initialCustomTags={[
          {
            id: "tag-saved",
            displayLabel: "Ancien",
            category: "context",
            color: null,
          },
        ]}
      />,
    );
    fireEvent.change(screen.getByLabelText("Libellé"), {
      target: { value: "  Marche  " },
    });
    fireEvent.change(screen.getByLabelText("Catégorie"), {
      target: { value: "protective" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() =>
      expect(mocks.saveMoodTagDefinition).toHaveBeenCalledWith({
        displayLabel: "Marche",
        category: "protective",
        color: null,
      }),
    );
    expect(screen.queryByText("Ancien · context")).not.toBeInTheDocument();
    expect(screen.getByText("Marche · protective")).toBeInTheDocument();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Tag enregistré");
  });

  it("keeps tag errors generic and renders English loading, error and empty states", async () => {
    state.locale = "en";
    mocks.saveMoodTagDefinition.mockResolvedValue({ serverError: "Denied" });
    const { unmount } = render(<MoodHistoryList initialCustomTags={[]} />);
    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "Trigger" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Denied"),
    );
    unmount();

    state.mode = "loading";
    const loading = render(<MoodHistoryList initialCustomTags={[]} />);
    expect(screen.getByText("My custom tags")).toBeInTheDocument();
    loading.unmount();

    state.mode = "error";
    const error = render(<MoodHistoryList initialCustomTags={[]} />);
    expect(screen.getByText("Search failed.")).toBeInTheDocument();
    error.unmount();

    state.mode = "empty";
    render(<MoodHistoryList initialCustomTags={[]} />);
    expect(
      screen.getByText("No entry matches these filters."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("maps server search errors without exposing a provider payload", async () => {
    mocks.searchJournal.mockResolvedValue({
      serverError: "Search unavailable",
    });
    render(<MoodHistoryList initialCustomTags={[]} />);
    await expect(getQueryFn()()).rejects.toThrow("Search unavailable");
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  locale: "fr" as "fr" | "en",
  previewLoading: false,
  exportLoading: false,
  previewQueryFn: undefined as undefined | (() => Promise<unknown>),
  exportQueryFn: undefined as undefined | (() => Promise<unknown>),
  previewEnabled: false,
  exportEnabled: false,
}));
const mocks = vi.hoisted(() => ({
  getExportPreview: vi.fn(),
  getExportData: vi.fn(),
  buildConsultationCsv: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
  anchorClick: vi.fn(),
  fetch: vi.fn(),
}));

const preview = {
  moodEntries: 4,
  medicationIntakes: 3,
  therapySessions: 2,
  exerciseLogs: 1,
  total: 10,
};
const exportData = {
  metadata: { formatVersion: "2.0" },
  mood: { stats: { count: 4, average: 6.5 }, entries: [] },
  medications: {
    adherencePercent: 75,
    list: [
      {
        name: "Traitement synthétique",
        dosage: "10 mg",
        frequency: "daily",
        isPRN: false,
        intakesCount: 3,
        skippedCount: 0,
        intakes: [],
        dosageChanges: [],
      },
    ],
  },
  therapy: { count: 2, sessions: [] },
  exercises: { count: 1, logs: [] },
  preparation: null,
};

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: {
    queryKey: unknown[];
    queryFn: () => Promise<unknown>;
    enabled: boolean;
  }) => {
    const isPreview = options.queryKey[0] === "export-preview";
    if (isPreview) {
      state.previewQueryFn = options.queryFn;
      state.previewEnabled = options.enabled;
      return { data: preview, isLoading: state.previewLoading };
    }
    state.exportQueryFn = options.queryFn;
    state.exportEnabled = options.enabled;
    return { data: exportData, isLoading: state.exportLoading };
  },
  useMutation: (options: {
    mutationFn: () => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onError: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: () => {
      void options.mutationFn().then(options.onSuccess).catch(options.onError);
    },
  }),
}));
vi.mock("@/features/export/export.action", () => ({
  getExportPreview: mocks.getExportPreview,
  getExportData: mocks.getExportData,
}));
vi.mock("@/features/export/csv-export", () => ({
  buildConsultationCsv: mocks.buildConsultationCsv,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: state.locale,
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

import { ExportForm } from "@app/(logged-in)/(patient-layout)/export/_components/export-form";

const getPreviewQueryFn = () => {
  if (!state.previewQueryFn) throw new Error("Expected preview query function");
  return state.previewQueryFn;
};
const getExportQueryFn = () => {
  if (!state.exportQueryFn) throw new Error("Expected export query function");
  return state.exportQueryFn;
};

describe("export form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    state.previewLoading = false;
    state.exportLoading = false;
    mocks.getExportPreview.mockResolvedValue({ data: preview });
    mocks.getExportData.mockResolvedValue({ data: exportData });
    mocks.buildConsultationCsv.mockReturnValue("date,value\n2026-08-13,0");
    mocks.createObjectURL.mockReturnValue("blob:moodday-test");
    mocks.fetch.mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(["pdf"])),
    });
    vi.stubGlobal("fetch", mocks.fetch);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: mocks.createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: mocks.revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      mocks.anchorClick,
    );
  });

  it("previews factual aggregates and downloads scoped PDF and CSV files", async () => {
    render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport
        billingEnabled
      />,
    );
    expect(
      screen.getByText('export.preview.moodEntries:{"count":4}'),
    ).toBeInTheDocument();
    expect(state.previewEnabled).toBe(true);
    expect(state.exportEnabled).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: "export.presets.twoWeeks" }),
    );
    expect(screen.getByLabelText("export.dateRange.start")).toHaveValue(
      "2026-07-30",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.preview" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Traitement synthétique")).toBeInTheDocument();
    expect(screen.getByText("6.5/10")).toBeInTheDocument();
    expect(state.exportEnabled).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.modifyPeriod" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.downloadPdf" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.downloadCsv" }),
    );
    await waitFor(() => expect(mocks.anchorClick).toHaveBeenCalledTimes(2));
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/export/pdf?startDate=2026-07-30&endDate=2026-08-13",
      expect.objectContaining({ credentials: "same-origin" }),
    );
    expect(mocks.getExportData).toHaveBeenCalledWith({
      startDate: "2026-07-30",
      endDate: "2026-08-13",
      purpose: "csv",
    });
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith("blob:moodday-test");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("export.download.success");
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "export.download.csvSuccess",
    );
  });

  it("executes bounded preview query contracts and rejects server errors", async () => {
    render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport
        billingEnabled
      />,
    );
    await getPreviewQueryFn()();
    expect(mocks.getExportPreview).toHaveBeenCalledWith({
      startDate: "2026-07-14",
      endDate: "2026-08-13",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.preview" }),
    );
    await getExportQueryFn()();
    expect(mocks.getExportData).toHaveBeenCalledWith({
      startDate: "2026-07-14",
      endDate: "2026-08-13",
      purpose: "preview",
    });

    mocks.getExportPreview.mockResolvedValue({
      serverError: "Preview refused",
    });
    await expect(getPreviewQueryFn()()).rejects.toThrow("Preview refused");
    mocks.getExportData.mockResolvedValue({ serverError: "Export refused" });
    await expect(getExportQueryFn()()).rejects.toThrow("Export refused");
  });

  it("blocks invalid ranges and keeps portability CSV available on Free", () => {
    const { unmount } = render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport
        billingEnabled
      />,
    );
    fireEvent.change(screen.getByLabelText("export.dateRange.start"), {
      target: { value: "2026-08-14" },
    });
    expect(
      screen.getByText("export.dateRange.invalidRange"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "export.actions.preview" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "export.actions.downloadPdf" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "export.actions.downloadCsv" }),
    ).toBeDisabled();
    expect(state.previewEnabled).toBe(false);
    unmount();

    render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport={false}
        billingEnabled
      />,
    );
    expect(
      screen.getByText(/PDF est inclus dans Moodday Plus/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "export.actions.downloadPdf" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "export.actions.downloadCsv" }),
    ).toBeEnabled();
  });

  it("surfaces download failures without leaking provider details", async () => {
    mocks.fetch.mockResolvedValue({ ok: false });
    mocks.getExportData
      .mockResolvedValueOnce({ serverError: "CSV refused" })
      .mockResolvedValueOnce({ data: null });
    render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport
        billingEnabled
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.downloadPdf" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.downloadCsv" }),
    );
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(2));
    expect(mocks.toastError).toHaveBeenCalledWith("export.download.noData");
    expect(mocks.toastError).toHaveBeenCalledWith("CSV refused");

    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.downloadCsv" }),
    );
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(3));
    expect(mocks.toastError).toHaveBeenLastCalledWith("export.download.noData");
  });

  it("renders the English Free disclosure and preview loading state", () => {
    state.locale = "en";
    const free = render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport={false}
        billingEnabled
      />,
    );
    expect(screen.getByText(/included with Moodday Plus/)).toBeInTheDocument();
    free.unmount();

    state.exportLoading = true;
    render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport
        billingEnabled
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "export.actions.preview" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByText("Traitement synthétique"),
    ).not.toBeInTheDocument();
  });

  it("does not promise a Plus PDF while billing is unavailable", () => {
    render(
      <ExportForm
        initialStartDate="2026-07-14"
        initialEndDate="2026-08-13"
        canCreateConsultationReport={false}
        billingEnabled={false}
      />,
    );

    expect(
      screen.getByText(/sera disponible après l’ouverture de Moodday Plus/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/est inclus dans Moodday Plus/),
    ).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "fr" as "fr" | "en" }));
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  saveConsultationPreparation: vi.fn(),
  setConsultationPreparationStatus: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ locale: state.locale }),
}));
vi.mock("@/features/consultation/consultation.action", () => ({
  saveConsultationPreparation: mocks.saveConsultationPreparation,
  setConsultationPreparationStatus: mocks.setConsultationPreparationStatus,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </main>
  ),
}));

import { ConsultationPreparationEditor } from "@app/(logged-in)/(patient-layout)/consultation/consultation-preparation-editor";

const preparations = [
  {
    id: "prep-draft",
    scheduledFor: new Date("2026-08-20T22:00:00.000Z"),
    title: "Rendez-vous principal",
    questions: ["Question A", "Question B"],
    importantEvents: ["Événement A"],
    periodStartDate: "2026-07-15",
    periodEndDate: "2026-08-13",
    personalNotes: "Note privée",
    status: "draft" as const,
  },
  {
    id: "prep-completed",
    scheduledFor: null,
    title: "Rendez-vous terminé",
    questions: [],
    importantEvents: [],
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
    personalNotes: null,
    status: "completed" as const,
  },
];

const renderEditor = (
  canCreateReport = true,
  data = preparations,
  billingEnabled = true,
) =>
  render(
    <ConsultationPreparationEditor
      preparations={data}
      todayDate="2026-08-13"
      initialStartDate="2026-07-14"
      timezone="Europe/Paris"
      canCreateReport={canCreateReport}
      billingEnabled={billingEnabled}
    />,
  );

describe("consultation preparation editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    mocks.saveConsultationPreparation.mockResolvedValue({
      data: { id: "saved" },
    });
    mocks.setConsultationPreparationStatus.mockResolvedValue({
      data: { id: "updated" },
    });
  });

  it("edits a draft, normalizes bounded lines and exposes a scoped PDF link", async () => {
    renderEditor();
    expect(
      screen.getByText(/Aucun diagnostic ni conseil médical/),
    ).toBeInTheDocument();
    const pdf = screen.getAllByRole("link", { name: "Télécharger le PDF" })[0];
    expect(pdf.getAttribute("href")).toContain("preparationId=prep-draft");
    expect(pdf).toHaveAttribute("download");

    fireEvent.click(screen.getAllByRole("button", { name: "Modifier" })[0]);
    expect(screen.getByLabelText("Titre")).toHaveValue("Rendez-vous principal");
    fireEvent.change(screen.getByLabelText(/Mes questions/), {
      target: {
        value: Array.from(
          { length: 22 },
          (_, index) => ` Question ${index} `,
        ).join("\n"),
      },
    });
    fireEvent.change(screen.getByLabelText(/Événements importants/), {
      target: { value: " Événement 1 \n\n Événement 2 " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Mettre à jour le brouillon" }),
    );

    await waitFor(() =>
      expect(mocks.saveConsultationPreparation).toHaveBeenCalled(),
    );
    const input = mocks.saveConsultationPreparation.mock.calls[0][0];
    expect(input).toMatchObject({
      id: "prep-draft",
      title: "Rendez-vous principal",
      scheduledFor: "2026-08-21",
      personalNotes: "Note privée",
      status: "draft",
      importantEvents: ["Événement 1", "Événement 2"],
    });
    expect(input.questions).toHaveLength(20);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Préparation enregistrée");
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByLabelText("Titre")).toHaveValue("");
  });

  it("creates an unscheduled draft and resets or cancels editing", async () => {
    renderEditor();
    const titleInput = screen.getByLabelText("Titre");
    await waitFor(() => expect(titleInput).toBeEnabled());
    expect(titleInput.closest("fieldset")).toHaveAttribute("aria-busy", "false");
    fireEvent.change(titleInput, {
      target: { value: "Nouveau" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer le brouillon" }),
    );
    await waitFor(() =>
      expect(mocks.saveConsultationPreparation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: undefined,
          title: "Nouveau",
          scheduledFor: null,
          personalNotes: null,
          questions: [],
          importantEvents: [],
        }),
      ),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Modifier" })[1]);
    expect(screen.getByLabelText("Titre")).toHaveValue("Rendez-vous terminé");
    fireEvent.click(
      screen.getByRole("button", { name: "Annuler la modification" }),
    );
    expect(screen.getByLabelText("Titre")).toHaveValue("");
  });

  it("changes completion and archive states and keeps server failures visible", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Marquer terminée" }));
    await waitFor(() =>
      expect(mocks.setConsultationPreparationStatus).toHaveBeenCalledTimes(1),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Archiver" })[1]);
    await waitFor(() =>
      expect(mocks.setConsultationPreparationStatus).toHaveBeenCalledTimes(2),
    );
    expect(mocks.setConsultationPreparationStatus).toHaveBeenCalledWith({
      id: "prep-draft",
      status: "completed",
    });
    expect(mocks.setConsultationPreparationStatus).toHaveBeenCalledWith({
      id: "prep-completed",
      status: "archived",
    });

    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Archiver" })[0],
      ).toBeEnabled(),
    );
    mocks.setConsultationPreparationStatus.mockResolvedValue({
      serverError: "Status refused",
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Archiver" })[0]);
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Status refused"),
    );
  });

  it("renders the Free and English empty states and maps save errors", async () => {
    state.locale = "en";
    mocks.saveConsultationPreparation.mockResolvedValue({
      serverError: "Save refused",
    });
    const { unmount } = renderEditor(false);
    expect(
      screen.getAllByRole("link", { name: "PDF with Moodday Plus" })[0],
    ).toHaveAttribute("href", "/pricing");
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Save refused"),
    );
    unmount();

    renderEditor(false, []);
    expect(screen.getByText("No draft yet.")).toBeInTheDocument();
  });

  it("does not link to an unavailable Plus purchase flow", () => {
    renderEditor(false, preparations, false);

    expect(
      screen.getAllByRole("button", {
        name: "PDF indisponible avant l’ouverture de Plus",
      }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "PDF avec Moodday Plus" }),
    ).not.toBeInTheDocument();
  });
});

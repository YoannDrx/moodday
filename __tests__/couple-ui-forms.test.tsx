import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saveCheckIn: vi.fn(),
  startPeriod: vi.fn(),
  endPeriod: vi.fn(),
  deletePeriod: vi.fn(),
  sendGesture: vi.fn(),
  queueAction: vi.fn(),
  session: {
    data: { user: { id: "owner-1" } } as { user: { id: string } } | null,
  },
}));

vi.mock("nanoid", () => ({ nanoid: () => "op-id" }));
vi.mock("@/lib/auth-client", () => ({ useSession: () => mocks.session }));
vi.mock("@/features/pwa/offline-actions", () => ({
  queueAction: mocks.queueAction,
}));
vi.mock("@/features/couple/couple.action", () => ({
  saveCheckInAction: mocks.saveCheckIn,
  startPeriodAction: mocks.startPeriod,
  endPeriodAction: mocks.endPeriod,
  deletePeriodAction: mocks.deletePeriod,
  sendGestureAction: mocks.sendGesture,
}));

import { CheckInForm } from "@/features/couple/ui/check-in-form";
import { GestureButtons } from "@/features/couple/ui/gesture-buttons";
import {
  DeletePeriodButton,
  PeriodButtons,
} from "@/features/couple/ui/period-buttons";

const renderForm = (
  overrides: Partial<React.ComponentProps<typeof CheckInForm>> = {},
) =>
  render(
    <CheckInForm
      localDate="2026-10-31"
      timeZone="Europe/Paris"
      partnerName="Tom"
      showsNeedsToPartner
      initial={null}
      customNeeds={[{ id: "tea", label: "Un thé" }]}
      {...overrides}
    />,
  );

const setOnline = (online: boolean) =>
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });

describe("Mon point", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
    mocks.session = { data: { user: { id: "owner-1" } } };
  });

  it("stays disabled until a state is picked, then saves the full check-in", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    mocks.saveCheckIn.mockResolvedValue({ data: { id: "c1" } });
    renderForm({ onDone });

    const submit = screen.getByRole("button", {
      name: "Enregistrer mon point",
    });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Fragile/ }));
    await user.click(screen.getByRole("button", { name: "Crampes" }));
    await user.click(screen.getByRole("button", { name: "Plus…" }));
    await user.click(
      screen.getByRole("button", { name: "Tête dans le brouillard" }),
    );
    await user.click(screen.getByRole("button", { name: "Un thé" }));
    expect(screen.getByText("Tom verra : « un thé ».")).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Note privée"),
      "  rien que pour moi  ",
    );
    await user.click(submit);

    await waitFor(() =>
      expect(mocks.saveCheckIn).toHaveBeenCalledWith({
        operationId: "op-id",
        localDate: "2026-10-31",
        timezone: "Europe/Paris",
        state: "fragile",
        symptoms: ["cramps", "focus"],
        needs: ["custom:tea"],
        privateNote: "rien que pour moi",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "C'est noté. Tom est prévenu·e en douceur.",
    );
    expect(onDone).toHaveBeenCalled();
  });

  it("caps needs at two and toggles a selection off again", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Du calme" }));
    await user.click(screen.getByRole("button", { name: "Un câlin" }));
    expect(screen.getByRole("button", { name: "De l'espace" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Du calme/ }));
    expect(screen.getByRole("button", { name: /Du calme/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "De l'espace" })).toBeEnabled();
  });

  it("explains what the partner sees for each sharing level", () => {
    const { unmount } = renderForm();
    expect(screen.getByText("Tom verra ton état du jour.")).toBeInTheDocument();
    unmount();

    renderForm({ showsNeedsToPartner: false });
    expect(
      screen.getByText(
        "Avec ton niveau de partage, Tom ne voit pas tes besoins.",
      ),
    ).toBeInTheDocument();
  });

  it("updates an existing check-in and shows the server refusal", async () => {
    const user = userEvent.setup();
    mocks.saveCheckIn.mockResolvedValue({ serverError: "Trop tard" });
    renderForm({
      partnerName: null,
      initial: {
        id: "c1",
        localDate: "2026-10-31",
        state: "hard",
        symptoms: [],
        needs: [],
        privateNote: null,
        updatedAt: "2026-10-31T08:00:00.000Z",
      } as never,
    });

    await user.click(
      screen.getByRole("button", { name: "Mettre à jour mon point" }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Trop tard"));
    expect(mocks.saveCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({ state: "hard", privateNote: null }),
    );
  });

  it("queues the check-in on the device when the network is off", async () => {
    const user = userEvent.setup();
    setOnline(false);
    renderForm();

    await user.click(screen.getByRole("button", { name: /Ça va/ }));
    await user.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );

    await waitFor(() =>
      expect(mocks.queueAction).toHaveBeenCalledWith("owner-1", {
        type: "check_in",
        localDate: "2026-10-31",
        timezone: "Europe/Paris",
        state: "ok",
        symptoms: [],
        needs: [],
        privateNote: undefined,
      }),
    );
    expect(mocks.saveCheckIn).not.toHaveBeenCalled();
  });

  it("falls back to the offline queue, then reports when nothing works", async () => {
    const user = userEvent.setup();
    mocks.saveCheckIn.mockRejectedValue(new Error("fetch failed"));
    mocks.session = { data: null } as never;
    renderForm({ partnerName: "Tom", showsNeedsToPartner: false });

    await user.click(screen.getByRole("button", { name: /Très dur/ }));
    await user.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Impossible d'enregistrer pour l'instant. Réessaie ?",
      ),
    );
    expect(mocks.queueAction).not.toHaveBeenCalled();
  });
});

describe("period buttons", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts a period today", async () => {
    const user = userEvent.setup();
    mocks.startPeriod.mockResolvedValue({ data: {} });
    render(<PeriodButtons today="2026-10-31" ongoing={false} />);

    await user.click(
      screen.getByRole("button", { name: "Mes règles ont commencé" }),
    );
    await waitFor(() =>
      expect(mocks.startPeriod).toHaveBeenCalledWith({ date: "2026-10-31" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Noté. Prends soin de toi.");
  });

  it("ends an ongoing period and surfaces a refusal", async () => {
    const user = userEvent.setup();
    mocks.endPeriod.mockResolvedValue({ validationErrors: {} });
    render(<PeriodButtons today="2026-10-31" ongoing />);

    await user.click(
      screen.getByRole("button", { name: "Mes règles sont finies" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Ça n'a pas marché."),
    );
  });

  it("deletes a period by id", async () => {
    const user = userEvent.setup();
    mocks.deletePeriod.mockResolvedValue({ data: {} });
    render(
      <DeletePeriodButton periodId="p1" label="les règles du 3 octobre" />,
    );

    await user.click(
      screen.getByRole("button", { name: "Supprimer les règles du 3 octobre" }),
    );
    await waitFor(() =>
      expect(mocks.deletePeriod).toHaveBeenCalledWith({ periodId: "p1" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Règles supprimées.");
  });
});

describe("gesture buttons", () => {
  beforeEach(() => vi.clearAllMocks());

  const renderGestures = () =>
    render(
      <GestureButtons
        checkInId="c1"
        ownerName="Léa"
        suggestions={[
          { key: "tea", label: "Préparer un thé" },
          { key: "hug", label: "Proposer un câlin" },
        ]}
      />,
    );

  it("sends a suggested gesture and marks it as sent", async () => {
    const user = userEvent.setup();
    mocks.sendGesture.mockResolvedValue({ data: {} });
    renderGestures();

    await user.click(screen.getByRole("button", { name: /Préparer un thé/ }));
    await waitFor(() =>
      expect(mocks.sendGesture).toHaveBeenCalledWith({
        operationId: "op-id",
        checkInId: "c1",
        kind: "tea",
        message: null,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Envoyé. Léa va le voir.");
    expect(
      screen.getByRole("button", { name: /Préparer un thé/ }),
    ).toHaveTextContent("✓");
  });

  it("sends a trimmed custom word and reports a failure", async () => {
    const user = userEvent.setup();
    mocks.sendGesture.mockResolvedValue({ serverError: "Lien en pause" });
    renderGestures();

    const send = screen.getByRole("button", { name: "Envoyer" });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Un petit mot"), "  je pense à toi ");
    await user.click(send);

    await waitFor(() =>
      expect(mocks.sendGesture).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "custom", message: "je pense à toi" }),
      ),
    );
    expect(toast.error).toHaveBeenCalledWith("Lien en pause");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  onDone: vi.fn(),
}));
vi.mock("../apps/mobile/src/lib/offline-queue", () => ({
  submitCheckIn: mocks.submit,
  newOperationId: () => "operation-0001",
}));
vi.mock("../apps/mobile/node_modules/react-native", () => {
  const Box = ({ children }: PropsWithChildren) =>
    createElement("div", null, children);
  return {
    useColorScheme: () => "light",
    StyleSheet: { create: (value: unknown) => value },
    View: Box,
    Text: Box,
    ActivityIndicator: () => createElement("span", null, "loading"),
    Pressable: ({
      children,
      onPress,
      disabled,
      accessibilityRole,
      accessibilityLabel,
      accessibilityState,
    }: PropsWithChildren<{
      onPress?: () => void;
      disabled?: boolean;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      accessibilityState?: { checked?: boolean };
    }>) =>
      createElement(
        "button",
        {
          onClick: onPress,
          disabled,
          role: accessibilityRole,
          "aria-label": accessibilityLabel,
          "aria-checked": accessibilityState?.checked,
        },
        children,
      ),
    TextInput: ({
      value,
      onChangeText,
      accessibilityLabel,
    }: {
      value: string;
      onChangeText: (value: string) => void;
      accessibilityLabel?: string;
    }) =>
      createElement("textarea", {
        value,
        "aria-label": accessibilityLabel,
        onChange: (event: { target: { value: string } }) =>
          onChangeText(event.target.value),
      }),
  };
});

import { CheckInForm } from "../apps/mobile/src/components/couple/check-in-form";

const renderForm = (
  level:
    | "cycle_only"
    | "cycle_state"
    | "cycle_state_needs" = "cycle_state_needs",
) =>
  render(
    <CheckInForm
      ownerId="owner-one"
      localDate="2026-10-31"
      partnerName="Tom"
      level={level}
      paused={false}
      initial={null}
      customNeeds={[{ id: "n1", label: "Un bain chaud" }]}
      onDone={mocks.onDone}
    />,
  );

describe("native daily check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.submit.mockResolvedValue({ status: "saved", checkIn: { id: "c1" } });
  });

  it("cannot be saved before a state is chosen", () => {
    renderForm();
    expect(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    ).toBeDisabled();
  });

  it("limits needs to two and previews what Tom will see", () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: /^Fragile/u }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Un câlin" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Du calme" }));

    expect(
      screen.getByRole("checkbox", { name: "De l'espace" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "Tom verra : « fragile » et « un câlin », « du calme ».",
      ),
    ).toBeInTheDocument();
  });

  it("offers her own custom needs next to the built-in ones", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: /^Fragile/u }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Un bain chaud" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith(
        "owner-one",
        expect.objectContaining({ needs: ["custom:n1"] }),
      ),
    );
  });

  it("tells her when her level keeps the needs to herself", () => {
    renderForm("cycle_state");
    fireEvent.click(screen.getByRole("radio", { name: /^Difficile/u }));
    expect(
      screen.getByText(
        "Tom verra : « difficile ». Tes besoins restent pour toi.",
      ),
    ).toBeInTheDocument();
  });

  it("saves with a fresh operationId and keeps the private note in her own payload", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: /^Très dur/u }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Un câlin" }));
    fireEvent.change(screen.getByLabelText("Note privée"), {
      target: { value: "  Rien que pour moi  " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );

    await waitFor(() => expect(mocks.onDone).toHaveBeenCalledOnce());
    expect(mocks.submit).toHaveBeenCalledWith(
      "owner-one",
      expect.objectContaining({
        operationId: "operation-0001",
        localDate: "2026-10-31",
        state: "very_hard",
        needs: ["hug"],
        privateNote: "Rien que pour moi",
      }),
    );
  });

  it("reports an offline save as queued rather than as an error", async () => {
    mocks.submit.mockResolvedValueOnce({ status: "queued", pending: 1 });
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: /^Ça va/u }));
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await waitFor(() =>
      expect(mocks.onDone).toHaveBeenCalledWith({
        status: "queued",
        pending: 1,
      }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the form and explains a server refusal", async () => {
    mocks.submit.mockRejectedValueOnce(new Error("validation_failed"));
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: /^Fragile/u }));
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await screen.findByText(/il n’a pas été enregistré/u);
    expect(mocks.onDone).not.toHaveBeenCalled();
  });
});

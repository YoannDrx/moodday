import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  draft: vi.fn(),
  discard: vi.fn(),
  cache: vi.fn(),
  push: vi.fn(),
  appListeners: new Set<(state: string) => void>(),
}));
vi.mock("../apps/mobile/node_modules/expo-router", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("../apps/mobile/node_modules/expo-crypto", () => ({
  randomUUID: () => crypto.randomUUID(),
}));
vi.mock("../apps/mobile/src/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: { id: "owner" } } }) },
}));
vi.mock("../apps/mobile/src/lib/local-database", () => ({
  saveCheckInOfflineFirst: mocks.save,
  saveUserDraftLocally: mocks.draft,
  discardUserDraft: mocks.discard,
  getCachedUserDraft: mocks.cache,
  refreshUserDraft: async () => null,
  flushPendingCheckIns: async () => undefined,
  getPendingOperationCount: async () => 0,
}));
vi.mock("../apps/mobile/src/components/brand-illustration", () => ({
  BrandIllustration: () => null,
}));
vi.mock("../apps/mobile/src/components/screen", () => ({
  Screen: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock("../apps/mobile/src/components/section-card", () => ({
  SectionCard: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock("../apps/mobile/node_modules/react-native", () => {
  const Box = ({ children }: PropsWithChildren) => <div>{children}</div>;
  return {
    AppState: {
      addEventListener: (_event: string, listener: (state: string) => void) => {
        mocks.appListeners.add(listener);
        return { remove: () => mocks.appListeners.delete(listener) };
      },
    },
    View: Box,
    Text: Box,
    StyleSheet: { create: (value: unknown) => value },
    Pressable: ({
      children,
      onPress,
      disabled,
      accessibilityRole,
      accessibilityLabel,
    }: PropsWithChildren<{
      onPress?: () => void;
      disabled?: boolean;
      accessibilityRole?: string;
      accessibilityLabel?: string;
    }>) =>
      createElement(
        "button",
        {
          onClick: onPress,
          disabled,
          role: accessibilityRole,
          "aria-label": accessibilityLabel,
        },
        children,
      ),
    TextInput: ({
      value,
      onChangeText,
      accessibilityLabel,
      editable,
    }: {
      value: string;
      onChangeText: (value: string) => void;
      accessibilityLabel: string;
      editable: boolean;
    }) => (
      <input
        aria-label={accessibilityLabel}
        value={value}
        disabled={!editable}
        onChange={(event) => onChangeText(event.target.value)}
      />
    ),
  };
});
import TodayScreen from "../apps/mobile/app/(tabs)/index";

describe("native daily check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.appListeners.clear();
    mocks.cache.mockResolvedValue(null);
    mocks.save.mockResolvedValue({ pending: true });
    mocks.draft.mockResolvedValue({ pending: true });
    mocks.discard.mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  const startQuick = async () => {
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Faire un point rapide" }),
      ).toBeEnabled(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Faire un point rapide" }),
    );
    for (const dimension of ["Moral", "Énergie", "Irritabilité"]) {
      fireEvent.click(
        screen.getByRole("radio", { name: `${dimension}, 0 sur 10` }),
      );
    }
  };

  it("refreshes the idle day when returning from the background", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
    render(<TodayScreen />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Je suis là" })).toBeEnabled(),
    );
    vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
    act(() => {
      for (const listener of [...mocks.appListeners]) listener("active");
    });
    await waitFor(() =>
      expect(mocks.cache).toHaveBeenCalledWith(
        "owner",
        "check_in",
        "2026-09-08",
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Je suis là" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Je suis là" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        "owner",
        expect.objectContaining({ localDate: "2026-09-08" }),
      ),
    );
  });

  it("keeps the day of an active draft across midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
    render(<TodayScreen />);
    await startQuick();
    vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
    act(() => {
      for (const listener of [...mocks.appListeners]) listener("active");
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        "owner",
        expect.objectContaining({ localDate: "2026-09-07", valence: 0 }),
      ),
    );
    await waitFor(() =>
      expect(mocks.cache).toHaveBeenCalledWith(
        "owner",
        "check_in",
        "2026-09-08",
      ),
    );
  });

  it("unlocks after a timezone change even when the civil date is unchanged", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
    let timezone = "Europe/Paris";
    const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    vi.spyOn(
      Intl.DateTimeFormat.prototype,
      "resolvedOptions",
    ).mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...resolvedOptions.call(this), timeZone: timezone };
    });
    render(<TodayScreen />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Je suis là" })).toBeEnabled(),
    );
    timezone = "America/New_York";
    act(() => {
      for (const listener of [...mocks.appListeners]) listener("active");
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Je suis là" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Je suis là" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        "owner",
        expect.objectContaining({
          timezone: "America/New_York",
          localDate: "2026-09-07",
        }),
      ),
    );
  });

  it("starts a second point without copying the previous answers", async () => {
    render(<TodayScreen />);
    await startQuick();
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Faire un autre point" }),
      ).toBeEnabled(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Faire un autre point" }),
    );
    expect(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    ).toBeDisabled();
  });

  it("waits for draft restoration before allowing a new point", async () => {
    let finish: (value: null) => void = () => undefined;
    mocks.cache.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<TodayScreen />);
    expect(
      screen.getByRole("button", { name: "Faire un point rapide" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Je suis là" })).toBeDisabled();
    finish(null);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Faire un point rapide" }),
      ).toBeEnabled(),
    );
  });

  it("finishes an in-flight draft write before committing and discarding it", async () => {
    let finish: (value: { pending: boolean }) => void = () => undefined;
    mocks.draft.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<TodayScreen />);
    await startQuick();
    await waitFor(() => expect(mocks.draft).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.discard).not.toHaveBeenCalled();
    finish({ pending: true });
    await waitFor(() => expect(mocks.discard).toHaveBeenCalled());
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it("submits optional complete context and a private note through the offline queue", async () => {
    render(<TodayScreen />);
    await startQuick();
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter du contexte, si tu veux" }),
    );
    fireEvent.change(screen.getByLabelText("Contexte (facultatif)"), {
      target: { value: " Repos " },
    });
    fireEvent.change(screen.getByLabelText("Note privée (facultatif)"), {
      target: { value: " Pour moi " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        "owner",
        expect.objectContaining({
          depth: "complete",
          valence: 0,
          activation: 0,
          irritability: 0,
          contexts: ["Repos"],
          note: "Pour moi",
          anxiety: undefined,
        }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Conservé sur cet appareil · synchronisation/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Préparation 2 sur 4")).not.toBeInTheDocument();
  });

  it("restores optional draft fields and does not clear them when cancellation fails", async () => {
    mocks.cache.mockResolvedValue({
      content: {
        mode: "complete",
        scores: { valence: 0, activation: 2, irritability: 4 },
        anxiety: 0,
        note: "À garder",
        contextNote: "Repos",
      },
    });
    mocks.discard.mockRejectedValue(new Error("storage unavailable"));
    render(<TodayScreen />);
    await waitFor(() =>
      expect(screen.getByLabelText("Note privée (facultatif)")).toHaveValue(
        "À garder",
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Annuler ce brouillon" }),
    );
    await waitFor(() =>
      expect(screen.getByText(/n’a pas été effacé/)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Note privée (facultatif)")).toHaveValue(
      "À garder",
    );
  });

  it("retains answers on a failed check-in and permits a later retry", async () => {
    mocks.save.mockRejectedValueOnce(new Error("storage unavailable"));
    render(<TodayScreen />);
    await startQuick();
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );
    await waitFor(() =>
      expect(screen.getByText(/n’a pas pu être confirmé/)).toBeInTheDocument(),
    );
    expect(mocks.discard).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    ).toBeEnabled();
  });
});

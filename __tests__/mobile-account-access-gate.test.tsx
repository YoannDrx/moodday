import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useEffect, type PropsWithChildren } from "react";
import { MoodDayApiError } from "../packages/api-client/src";
const mocks = vi.hoisted(() => ({
  getAccess: vi.fn(),
  accept: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  deleteItem: vi.fn(),
  signOut: vi.fn(),
  sendVerificationEmail: vi.fn(),
  pendingCheckIns: vi.fn(),
  signOutOfMoodday: vi.fn(),
  pathname: "/",
  userId: "owner-one",
  sessionId: "session-one",
}));
vi.mock("../apps/mobile/src/lib/offline-queue", () => ({
  countOfflineCheckIns: mocks.pendingCheckIns,
}));
vi.mock("../apps/mobile/src/lib/sign-out", () => ({
  signOutOfMoodday: mocks.signOutOfMoodday,
}));
vi.mock("../apps/mobile/node_modules/expo-router", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../apps/mobile/node_modules/expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
  digestStringAsync: async (_algorithm: string, owner: string) =>
    `hash-${owner}`,
}));
vi.mock("../apps/mobile/node_modules/expo-secure-store", () => ({
  getItemAsync: mocks.getItem,
  setItemAsync: mocks.setItem,
  deleteItemAsync: mocks.deleteItem,
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: "device-only",
}));
vi.mock("../apps/mobile/src/lib/api", () => ({
  api: {
    getAccountAccess: mocks.getAccess,
    acceptAccountConsents: mocks.accept,
  },
  appBaseUrl: "https://moodday.example",
}));
vi.mock("../apps/mobile/src/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: mocks.userId, email: "owner@example.com" },
        session: { id: mocks.sessionId },
      },
    }),
    signOut: mocks.signOut,
    sendVerificationEmail: mocks.sendVerificationEmail,
  },
}));
vi.mock("../apps/mobile/node_modules/react-native", () => {
  const Box = ({ children }: PropsWithChildren) =>
    createElement("div", null, children);
  return {
    useColorScheme: () => "light",
    Linking: { openURL: vi.fn() },
    StyleSheet: { create: (value: unknown) => value },
    View: Box,
    Text: Box,
    ScrollView: Box,
    ActivityIndicator: () => createElement("span", null, "loading"),
    Pressable: ({
      children,
      onPress,
      disabled,
      accessibilityRole,
      accessibilityState,
    }: PropsWithChildren<{
      onPress?: () => void;
      disabled?: boolean;
      accessibilityRole?: string;
      accessibilityState?: { checked?: boolean };
    }>) =>
      createElement(
        "button",
        {
          onClick: onPress,
          disabled,
          role: accessibilityRole,
          "aria-checked": accessibilityState?.checked,
        },
        children,
      ),
  };
});
vi.mock("../apps/mobile/node_modules/react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: PropsWithChildren) =>
    createElement("div", null, children),
}));
import { AccountAccessGate } from "../apps/mobile/src/components/account-access-gate";
const versions = {
  terms: "terms-v1",
  privacy: "privacy-v1",
  healthData: "health-v1",
  minimumAge: 18,
  country: "FR",
};
const initial = { emailVerified: true, consentsAccepted: false, versions };
const renderGate = () =>
  render(
    <AccountAccessGate>
      <div>private-product</div>
    </AccountAccessGate>,
  );

describe("native consent boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pathname = "/";
    mocks.userId = "owner-one";
    mocks.sessionId = "session-one";
    mocks.getAccess.mockResolvedValue(initial);
    mocks.pendingCheckIns.mockResolvedValue(0);
    mocks.signOutOfMoodday.mockResolvedValue(undefined);
  });
  it("does not run protected child effects before consent verification", async () => {
    const healthRead = vi.fn();
    function HealthScreen() {
      useEffect(() => {
        healthRead();
      }, []);
      return <div>health-screen</div>;
    }
    render(
      <AccountAccessGate>
        <HealthScreen />
      </AccountAccessGate>,
    );
    await screen.findAllByRole("checkbox");
    expect(healthRead).not.toHaveBeenCalled();
  });
  it("does not mount product content until all four choices are recorded by the server", async () => {
    mocks.accept.mockResolvedValue({ ...initial, consentsAccepted: true });
    renderGate();
    expect(screen.queryByText("private-product")).not.toBeInTheDocument();
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: "Continuer avec ces choix" }),
    ).toBeDisabled();
    for (const checkbox of checkboxes) {
      expect(checkbox).toHaveAttribute("aria-checked", "false");
      fireEvent.click(checkbox);
    }
    fireEvent.click(
      screen.getByRole("button", { name: "Continuer avec ces choix" }),
    );
    await screen.findByText("private-product");
    expect(mocks.accept).toHaveBeenCalledWith(
      expect.objectContaining({
        versions,
        healthDataConsentAccepted: true,
        locale: "fr",
      }),
    );
  });
  it("preserves offline access only for an owner previously approved online", async () => {
    mocks.getAccess.mockRejectedValue(new TypeError("offline"));
    mocks.getItem.mockResolvedValue("verified");
    renderGate();
    await screen.findByText("private-product");
    expect(mocks.getItem).toHaveBeenCalledWith(
      "moodday.consent-access.hash-owner-one",
    );
  });
  it("does not open a first-time account offline", async () => {
    mocks.getAccess.mockRejectedValue(new TypeError("offline"));
    mocks.getItem.mockResolvedValue(null);
    renderGate();
    await screen.findByText(/La vérification du compte est indisponible/);
    expect(screen.queryByText("private-product")).not.toBeInTheDocument();
  });
  it("does not use the offline marker after a server authentication refusal", async () => {
    mocks.getAccess.mockRejectedValue(
      new MoodDayApiError({
        code: "authentication_required",
        recoverable: false,
        message: "denied",
        requestId: "test",
      }),
    );
    mocks.getItem.mockResolvedValue("verified");
    renderGate();
    await waitFor(() =>
      expect(mocks.deleteItem).toHaveBeenCalledWith(
        "moodday.consent-access.hash-owner-one",
      ),
    );
    expect(screen.queryByText("private-product")).not.toBeInTheDocument();
    expect(mocks.getItem).not.toHaveBeenCalled();
  });
  it("keeps unverified emails and rejected acceptances outside the product", async () => {
    mocks.getAccess.mockResolvedValue({ ...initial, emailVerified: false });
    renderGate();
    await screen.findByText(/Vérifie ton adresse e-mail/);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText("private-product")).not.toBeInTheDocument();
  });
  it("resends the verification link and reports a delivery failure", async () => {
    mocks.getAccess.mockResolvedValue({ ...initial, emailVerified: false });
    mocks.sendVerificationEmail
      .mockResolvedValueOnce({ data: { status: true }, error: null })
      .mockResolvedValueOnce({ data: null, error: { status: 500 } });
    renderGate();

    fireEvent.click(await screen.findByText("Renvoyer le lien"));
    await screen.findByText(/Un nouveau lien vient de partir/);
    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith({
      email: "owner@example.com",
    });

    fireEvent.click(screen.getByText("Renvoyer le lien"));
    await screen.findByText(/n’a pas pu être envoyé/);
    expect(screen.queryByText("private-product")).not.toBeInTheDocument();
  });
  it("blocks sign-out while an offline check-in still waits for the network", async () => {
    mocks.pendingCheckIns.mockResolvedValue(1);
    renderGate();
    fireEvent.click(
      await screen.findByRole("button", { name: "Me déconnecter" }),
    );
    await screen.findByText(/Un point fait hors ligne attend encore le réseau/);
    expect(mocks.signOutOfMoodday).not.toHaveBeenCalled();
  });
  it("signs out through the shared sign-out when nothing waits on the device", async () => {
    renderGate();
    fireEvent.click(
      await screen.findByRole("button", { name: "Me déconnecter" }),
    );
    await waitFor(() =>
      expect(mocks.signOutOfMoodday).toHaveBeenCalledWith("owner-one"),
    );
  });
  it("keeps the help screen reachable before consent", async () => {
    mocks.pathname = "/help";
    renderGate();
    expect(screen.getByText("private-product")).toBeInTheDocument();
    expect(mocks.getAccess).not.toHaveBeenCalled();
  });
});

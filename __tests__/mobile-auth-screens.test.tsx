import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  social: vi.fn(),
  verifyTotp: vi.fn(),
  verifyBackupCode: vi.fn(),
  requestPasswordReset: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  openURL: vi.fn(),
  clearInvalidation: vi.fn(),
}));
vi.mock("../apps/mobile/node_modules/expo-router", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock("../apps/mobile/src/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signIn, social: mocks.social },
    twoFactor: {
      verifyTotp: mocks.verifyTotp,
      verifyBackupCode: mocks.verifyBackupCode,
    },
    requestPasswordReset: mocks.requestPasswordReset,
  },
}));
vi.mock("../apps/mobile/src/lib/session-security", () => ({
  clearMobileSessionInvalidation: mocks.clearInvalidation,
}));
vi.mock("../apps/mobile/src/lib/api", () => ({
  appBaseUrl: "https://moodday.example",
}));
vi.mock("../apps/mobile/node_modules/react-native", () => {
  const Box = ({ children }: PropsWithChildren) =>
    createElement("div", null, children);
  return {
    useColorScheme: () => "light",
    ActivityIndicator: () => createElement("span", null, "loading"),
    Platform: { OS: "ios" },
    Linking: { openURL: mocks.openURL },
    StyleSheet: { create: (value: unknown) => value },
    View: Box,
    Text: Box,
    ScrollView: Box,
    KeyboardAvoidingView: Box,
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
      secureTextEntry,
    }: {
      value: string;
      onChangeText: (value: string) => void;
      accessibilityLabel?: string;
      secureTextEntry?: boolean;
    }) =>
      createElement("input", {
        value,
        "aria-label": accessibilityLabel,
        type: secureTextEntry ? "password" : "text",
        onChange: (event: { target: { value: string } }) =>
          onChangeText(event.target.value),
      }),
  };
});
vi.mock("../apps/mobile/node_modules/react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: PropsWithChildren) =>
    createElement("div", null, children),
}));

import SignInScreen from "../apps/mobile/app/sign-in";
import TwoFactorScreen from "../apps/mobile/app/two-factor";
import ForgotPasswordScreen from "../apps/mobile/app/forgot-password";

describe("native authentication interactions (host controls adapted for DOM)", () => {
  beforeEach(() => {
    vi.stubEnv("EXPO_PUBLIC_OAUTH_GOOGLE_ENABLED", "true");
    vi.stubEnv("EXPO_PUBLIC_OAUTH_APPLE_ENABLED", "true");
    vi.clearAllMocks();
  });
  const fillCredentials = () => {
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "person@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "synthetic-password" },
    });
  };
  it("recovers after a network rejection and lets the user try again", async () => {
    mocks.signIn.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<SignInScreen />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await screen.findByText(/Vérifie ta connexion puis réessaie/);
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(mocks.replace).not.toHaveBeenCalled();
    mocks.signIn.mockResolvedValueOnce({ data: { user: { id: "owner" } } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/"));
  });
  it("routes a second-factor response to the challenge without opening product data", async () => {
    mocks.signIn.mockResolvedValueOnce({ data: { twoFactorRedirect: true } });
    render(<SignInScreen />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/two-factor"));
    expect(mocks.clearInvalidation).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("supports recovery codes after a rejected TOTP without trusting the device", async () => {
    mocks.verifyTotp.mockResolvedValueOnce({ error: { code: "INVALID_CODE" } });
    mocks.verifyBackupCode.mockResolvedValueOnce({
      data: { token: "synthetic" },
    });
    render(<TwoFactorScreen />);
    fireEvent.change(screen.getByLabelText("Code à six chiffres"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await screen.findByText(/Le code est invalide/);
    fireEvent.click(
      screen.getByRole("button", { name: "Utiliser un code de récupération" }),
    );
    fireEvent.change(screen.getByLabelText("Code de récupération"), {
      target: { value: " recovery-code " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await waitFor(() =>
      expect(mocks.verifyBackupCode).toHaveBeenCalledWith({
        code: "recovery-code",
        trustDevice: false,
      }),
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/"));
  });
  it("does not disclose whether an email exists during password recovery", async () => {
    mocks.requestPasswordReset.mockResolvedValueOnce({
      data: { status: true },
    });
    render(<ForgotPasswordScreen />);
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "person@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Recevoir un lien" }));
    await screen.findByText(/Si un compte correspond/);
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
      email: "person@example.test",
      redirectTo: "https://moodday.example/auth/reset-password",
    });
  });
});

afterEach(() => vi.unstubAllEnvs());

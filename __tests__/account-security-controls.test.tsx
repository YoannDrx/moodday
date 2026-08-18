import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "fr" as "fr" | "en" }));
const mocks = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  listSessions: vi.fn(),
  listPasskeys: vi.fn(),
  addPasskey: vi.fn(),
  deletePasskey: vi.fn(),
  enableTwoFactor: vi.fn(),
  verifyTotp: vi.fn(),
  disableTwoFactor: vi.fn(),
  generateBackupCodes: vi.fn(),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  signInEmail: vi.fn(),
  signInPasskey: vi.fn(),
}));

const sessions = [
  {
    id: "session-current",
    token: "token-current",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-13T08:00:00.000Z",
    userAgent: "Mozilla Safari iPhone",
  },
  {
    id: "session-android",
    token: "token-android",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-12T08:00:00.000Z",
    userAgent: "Mozilla Android Chrome",
  },
  {
    id: "session-firefox",
    token: "token-firefox",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-11T08:00:00.000Z",
    userAgent: "Mozilla Firefox",
  },
  {
    id: "session-edge",
    token: "token-edge",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
    userAgent: "Mozilla Edg",
  },
  {
    id: "session-chrome",
    token: "token-chrome",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-09T08:00:00.000Z",
    userAgent: "Mozilla Chrome",
  },
  {
    id: "session-safari",
    token: "token-safari",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-08T08:00:00.000Z",
    userAgent: "Mozilla Safari",
  },
  {
    id: "session-web",
    token: "token-web",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-07T08:00:00.000Z",
    userAgent: "Custom Agent",
  },
  {
    id: "session-unknown",
    token: "token-unknown",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-06T08:00:00.000Z",
    userAgent: null,
  },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.routerRefresh }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ locale: state.locale }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@better-auth/passkey", () => ({
  getAuthenticatorName: (aaguid?: string) =>
    aaguid === "known-aaguid" ? "Known authenticator" : null,
}));
vi.mock("react-qr-code", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="totp-qr">{value}</div>
  ),
}));
vi.mock("@/components/nowts/glass-card", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
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
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          email: "member@moodday.invalid",
        },
        session: { token: "token-current" },
      },
    }),
    listSessions: mocks.listSessions,
    passkey: {
      listUserPasskeys: mocks.listPasskeys,
      addPasskey: mocks.addPasskey,
      deletePasskey: mocks.deletePasskey,
    },
    twoFactor: {
      enable: mocks.enableTwoFactor,
      verifyTotp: mocks.verifyTotp,
      disable: mocks.disableTwoFactor,
      generateBackupCodes: mocks.generateBackupCodes,
    },
    revokeSession: mocks.revokeSession,
    revokeOtherSessions: mocks.revokeOtherSessions,
    signIn: {
      email: mocks.signInEmail,
      passkey: mocks.signInPasskey,
    },
  },
}));

import { AccountSecurityControls } from "@app/(logged-in)/(patient-layout)/settings/security/_components/account-security-controls";

describe("account security controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    mocks.listSessions.mockResolvedValue({ data: sessions });
    mocks.listPasskeys.mockResolvedValue({
      data: [
        {
          id: "passkey-named",
          name: "MacBook",
          aaguid: null,
          deviceType: "multiDevice",
          backedUp: true,
        },
        {
          id: "passkey-authenticator",
          name: null,
          aaguid: "known-aaguid",
          deviceType: "singleDevice",
          backedUp: false,
        },
        {
          id: "passkey-fallback",
          name: null,
          aaguid: null,
          deviceType: "singleDevice",
          backedUp: false,
        },
      ],
    });
    mocks.addPasskey.mockResolvedValue({ data: { id: "passkey-new" } });
    mocks.deletePasskey.mockResolvedValue({ data: { success: true } });
    mocks.enableTwoFactor.mockResolvedValue({
      data: {
        totpURI: "otpauth://totp/Moodday",
        backupCodes: ["backup-1", "backup-2"],
      },
    });
    mocks.verifyTotp.mockResolvedValue({ data: { success: true } });
    mocks.disableTwoFactor.mockResolvedValue({ data: { success: true } });
    mocks.generateBackupCodes.mockResolvedValue({
      data: { backupCodes: ["new-backup-1", "new-backup-2"] },
    });
    mocks.revokeSession.mockResolvedValue({ data: { success: true } });
    mocks.revokeOtherSessions.mockResolvedValue({ data: { success: true } });
    mocks.signInEmail.mockResolvedValue({ data: { success: true } });
    mocks.signInPasskey.mockResolvedValue({ data: { success: true } });
  });

  it("loads and labels all sessions and passkey fallbacks without exposing tokens", async () => {
    render(<AccountSecurityControls initialTwoFactorEnabled={false} />);

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Safari sur iPhone/iPad")).toBeInTheDocument(),
    );
    for (const device of [
      "Navigateur Android",
      "Firefox",
      "Microsoft Edge",
      "Google Chrome",
      "Safari",
      "Navigateur web",
      "Appareil inconnu",
    ]) {
      expect(screen.getByText(device)).toBeInTheDocument();
    }
    expect(screen.getByText(/session actuelle/)).toBeInTheDocument();
    expect(screen.getByText("MacBook")).toBeInTheDocument();
    expect(screen.getByText("Known authenticator")).toBeInTheDocument();
    expect(screen.getByText("Passkey")).toBeInTheDocument();
    expect(screen.queryByText("token-current")).not.toBeInTheDocument();
  });

  it("reauthenticates by password and passkey for the ten-minute sensitive window", async () => {
    const user = userEvent.setup();
    render(<AccountSecurityControls initialTwoFactorEnabled={false} />);
    await waitFor(() =>
      expect(screen.getByText("MacBook")).toBeInTheDocument(),
    );

    await user.type(
      screen.getByLabelText("Mot de passe", { exact: true }),
      "secret-value",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmer par mot de passe" }),
    );
    await waitFor(() =>
      expect(mocks.signInEmail).toHaveBeenCalledWith({
        email: "member@moodday.invalid",
        password: "secret-value",
        rememberMe: true,
      }),
    );
    expect(mocks.routerRefresh).toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Confirmer par passkey" }),
    );
    await waitFor(() => expect(mocks.signInPasskey).toHaveBeenCalled());
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Identité confirmée pour dix minutes",
    );
  });

  it("adds, deletes and uses session revocation controls", async () => {
    const user = userEvent.setup();
    render(<AccountSecurityControls initialTwoFactorEnabled={false} />);
    await waitFor(() =>
      expect(screen.getByText("MacBook")).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: "Ajouter une passkey" }),
    );
    await waitFor(() =>
      expect(mocks.addPasskey).toHaveBeenCalledWith({ name: "Clé Moodday" }),
    );
    await user.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);
    await waitFor(() =>
      expect(mocks.deletePasskey).toHaveBeenCalledWith({ id: "passkey-named" }),
    );

    await user.click(screen.getAllByRole("button", { name: "Révoquer" })[0]);
    await waitFor(() =>
      expect(mocks.revokeSession).toHaveBeenCalledWith({
        token: "token-android",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Déconnecter tous les autres appareils",
      }),
    );
    await waitFor(() => expect(mocks.revokeOtherSessions).toHaveBeenCalled());
    expect(mocks.listSessions.mock.calls.length).toBeGreaterThan(1);
  });

  it("completes TOTP enrollment, displays one-time recovery codes, regenerates and disables", async () => {
    const user = userEvent.setup();
    render(<AccountSecurityControls initialTwoFactorEnabled={false} />);
    await waitFor(() =>
      expect(screen.getByText("MacBook")).toBeInTheDocument(),
    );

    await user.type(
      screen.getByLabelText("Mot de passe (si votre compte en possède un)"),
      "totp-password",
    );
    await user.click(screen.getByRole("button", { name: "Configurer TOTP" }));
    await waitFor(() =>
      expect(screen.getByTestId("totp-qr")).toHaveTextContent("otpauth://"),
    );
    expect(screen.getByText("backup-1")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Code à six chiffres"), "123456");
    await user.click(
      screen.getByRole("button", { name: "Vérifier et activer" }),
    );
    await waitFor(() =>
      expect(mocks.verifyTotp).toHaveBeenCalledWith({
        code: "123456",
        trustDevice: false,
      }),
    );
    expect(
      screen.getByText("La double authentification est active."),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Régénérer les codes de récupération",
      }),
    );
    await waitFor(() =>
      expect(screen.getByText("new-backup-1")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Désactiver TOTP" }));
    await waitFor(() => expect(mocks.disableTwoFactor).toHaveBeenCalled());
    expect(screen.getByText(/Aucun SMS n’est utilisé/)).toBeInTheDocument();
  });

  it("supports already-enabled TOTP and English error paths", async () => {
    state.locale = "en";
    mocks.addPasskey.mockResolvedValueOnce({ error: { message: "failed" } });
    mocks.revokeOtherSessions.mockResolvedValueOnce({
      error: { message: "failed" },
    });
    mocks.generateBackupCodes.mockResolvedValueOnce({
      error: { message: "failed" },
    });
    const user = userEvent.setup();
    render(<AccountSecurityControls initialTwoFactorEnabled={true} />);
    await waitFor(() =>
      expect(screen.getByText("MacBook")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Add a passkey" }));
    await user.click(
      screen.getByRole("button", { name: "Sign out all other devices" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Regenerate recovery codes" }),
    );
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        "The passkey could not be added. Reauthenticate and try again.",
      );
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Unable to revoke sessions",
      );
      expect(mocks.toastError).toHaveBeenCalledWith("Unable to generate codes");
    });
  });
});

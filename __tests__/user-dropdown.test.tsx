import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionData: null as null | {
    user: { name?: string | null; email?: string | null; role?: string | null };
    session: { impersonatedBy?: string | null };
  },
  pending: false,
  refetch: vi.fn(),
  setTheme: vi.fn(),
  refresh: vi.fn(),
  requestSignOut: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: mocks.sessionData,
    isPending: mocks.pending,
    refetch: mocks.refetch,
  }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: mocks.setTheme }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/features/auth/use-protected-sign-out", () => ({
  useProtectedSignOut: () => ({
    isPending: false,
    requestSignOut: mocks.requestSignOut,
    dialog: <div data-testid="signout-dialog" />,
  }),
}));
vi.mock("@/features/auth/user-dropdown-logout", () => ({
  UserDropdownLogout: ({ onLogout }: { onLogout: () => void }) => (
    <button type="button" onClick={onLogout}>logout</button>
  ),
}));
vi.mock("@/features/auth/user-dropdown-stop-impersonating", () => ({
  UserDropdownStopImpersonating: () => <div>stop-impersonating</div>,
}));
vi.mock("@/components/ui/dropdown-menu", () => {
  const Primitive = ({
    children,
    asChild: _asChild,
    disabled,
    onClick,
    ...props
  }: React.ComponentProps<"div"> & {
    asChild?: boolean;
    disabled?: boolean;
  }) => (
    <div
      role="menuitem"
      aria-disabled={disabled ?? undefined}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </div>
  );
  return {
    DropdownMenu: Primitive,
    DropdownMenuContent: Primitive,
    DropdownMenuGroup: Primitive,
    DropdownMenuItem: Primitive,
    DropdownMenuLabel: Primitive,
    DropdownMenuPortal: Primitive,
    DropdownMenuSeparator: Primitive,
    DropdownMenuSub: Primitive,
    DropdownMenuSubContent: Primitive,
    DropdownMenuSubTrigger: Primitive,
    DropdownMenuTrigger: Primitive,
  };
});

import { UserDropdown } from "@/features/auth/user-dropdown";

describe("user dropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionData = null;
    mocks.pending = false;
    document.documentElement.lang = "en";
  });

  it("renders only the trigger when no authenticated or server user exists", () => {
    render(<UserDropdown><button type="button">profile</button></UserDropdown>);
    expect(screen.getByRole("button", { name: "profile" })).toBeInTheDocument();
    expect(screen.queryByTestId("signout-dialog")).not.toBeInTheDocument();
  });

  it("uses the server fallback immediately and refetches the client session", async () => {
    render(
      <UserDropdown user={{ name: "Alice", email: "alice@example.test" }}>
        <button type="button">profile</button>
      </UserDropdown>,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.test")).toBeInTheDocument();
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(mocks.requestSignOut).toHaveBeenCalled();
  });

  it("shows admin and impersonation controls and applies local theme and locale choices", () => {
    mocks.sessionData = {
      user: { name: "Admin", email: "admin@example.test", role: "admin" },
      session: { impersonatedBy: "operator-1" },
    };
    render(
      <UserDropdown>
        <button type="button">profile</button>
      </UserDropdown>,
    );
    expect(screen.getByRole("link", { name: /admin.nav.section/ })).toHaveAttribute("href", "/admin");
    expect(screen.getByText("stop-impersonating")).toBeInTheDocument();
    fireEvent.click(screen.getByText("theme.dark"));
    fireEvent.click(screen.getByText("theme.light"));
    fireEvent.click(screen.getByText("theme.system"));
    expect(mocks.setTheme.mock.calls.map(([theme]) => theme)).toEqual([
      "dark",
      "light",
      "system",
    ]);
    fireEvent.click(screen.getByText("language.fr"));
    expect(document.documentElement.lang).toBe("fr");
    expect(document.cookie).toContain("locale=fr");
    expect(mocks.refresh).toHaveBeenCalled();
  });
});

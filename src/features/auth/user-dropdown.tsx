"use client";

import { Typography } from "@/components/nowts/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth-client";
import {
  Globe,
  LayoutDashboard,
  Monitor,
  Moon,
  MoveUpRight,
  Settings,
  Shield,
  SunMedium,
  SunMoon,
} from "lucide-react";

import { localeCookieName, type Locale } from "@/i18n/config";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { useI18n } from "@/i18n/provider";
import { UserDropdownLogout } from "./user-dropdown-logout";
import { UserDropdownStopImpersonating } from "./user-dropdown-stop-impersonating";
import { useProtectedSignOut } from "./use-protected-sign-out";

const setLocaleCookie = (locale: Locale) => {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
  document.documentElement.lang = locale;
};

type UserDropdownProps = PropsWithChildren<{
  /** User data passed from server component as fallback */
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}>;

export const UserDropdown = ({
  children,
  user: userProp,
}: UserDropdownProps) => {
  const { data: sessionData, isPending, refetch } = useSession();
  const theme = useTheme();
  const router = useRouter();
  const { locale, t } = useI18n();
  const logout = useProtectedSignOut();

  // Refetch session on mount if no session data but we have a user prop
  // This handles the case where server has the session but client doesn't yet
  useEffect(() => {
    if (!sessionData?.user && userProp && !isPending) {
      void refetch();
    }
  }, [sessionData?.user, userProp, isPending, refetch]);

  // Use session user, fallback to prop user for display
  // This allows the dropdown to work immediately with server-provided user data
  const user = sessionData?.user ?? userProp;

  // If no user at all (neither from session nor prop), just render children
  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>
            {user.name ? (
              <>
                <Typography variant="small">{user.name}</Typography>
                <Typography variant="muted">{user.email}</Typography>
              </>
            ) : (
              <Typography variant="small">{user.email}</Typography>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 size-4" />
              {t("nav.dashboard")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile">
              <Settings className="mr-2 size-4" />
              {t("settings.title")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">
              <MoveUpRight className="mr-2 size-4" />
              {t("nav.backToSite")}
            </Link>
          </DropdownMenuItem>
          {user.role === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 size-4" />
                {t("admin.nav.section")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunMoon className="text-muted-foreground mr-4 size-4" />
              <span>{t("theme.title")}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => theme.setTheme("dark")}>
                  <SunMedium className="mr-2 size-4" />
                  <span>{t("theme.dark")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => theme.setTheme("light")}>
                  <Moon className="mr-2 size-4" />
                  <span>{t("theme.light")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => theme.setTheme("system")}>
                  <Monitor className="mr-2 size-4" />
                  <span>{t("theme.system")}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe className="text-muted-foreground mr-4 size-4" />
              <span>{t("language.title")}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setLocaleCookie("fr");
                    router.refresh();
                  }}
                  disabled={locale === "fr"}
                >
                  <span>{t("language.fr")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setLocaleCookie("en");
                    router.refresh();
                  }}
                  disabled={locale === "en"}
                >
                  <span>{t("language.en")}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <UserDropdownLogout
              disabled={!logout.canSignOut}
              isPending={logout.isPending}
              onLogout={() => void logout.requestSignOut()}
            />
            {sessionData?.session.impersonatedBy ? (
              <UserDropdownStopImpersonating />
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {logout.dialog}
    </>
  );
};

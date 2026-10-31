import { MooddayLogo } from "@/components/brand/moodday-logo";
import { LoggedInButton } from "@/features/auth/sign-in-button";
import { LifeBuoy, Settings } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { AppBottomNav, AppSideNav, type AppRole } from "./app-nav";

export function AppShell({
  role,
  user,
  children,
}: PropsWithChildren<{
  role: AppRole | null;
  user: { name?: string | null; email?: string | null; image?: string | null };
}>) {
  return (
    <div className="bg-background min-h-full">
      <a
        href="#contenu"
        className="focus:bg-honey sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>
      <header className="bg-background/90 sticky top-0 z-30 border-b-2 border-[var(--ink)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/today" aria-label="Aujourd'hui">
            <MooddayLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/crisis"
              className="text-crisis inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-current px-3 text-[13px] font-bold"
            >
              <LifeBuoy className="size-4" aria-hidden />
              <span>
                Besoin d'aide
                <span className="hidden sm:inline"> maintenant</span>
              </span>
            </Link>
            <Link
              href="/settings"
              className="hover:bg-accent hidden size-9 items-center justify-center rounded-full sm:flex"
            >
              <Settings className="size-5" aria-hidden />
              <span className="sr-only">Réglages</span>
            </Link>
            <LoggedInButton user={user} />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 pt-6 pb-28 sm:px-6 md:pb-12">
        {role && (
          <aside className="w-52 shrink-0 max-md:hidden">
            <div className="sticky top-24">
              <AppSideNav role={role} />
            </div>
          </aside>
        )}
        <main id="contenu" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      {role && <AppBottomNav role={role} />}
    </div>
  );
}

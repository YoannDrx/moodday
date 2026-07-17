"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageToggle } from "@/features/i18n/language-toggle";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { useI18n } from "@/i18n/provider";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavbarDark() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useI18n();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t("landing2.nav.features"), href: "/#features" },
    { label: t("landing2.nav.security"), href: "/#security" },
    { label: t("landing2.nav.pricing"), href: "/#pricing" },
    { label: t("landing2.nav.guides"), href: "/guides" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 py-3 backdrop-blur-lg"
          : "bg-transparent py-6",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <MooddayLogo />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
              >
                {t("nav.dashboard")}
              </Link>
              <Link
                href="/dashboard"
                className="ml-2 hidden sm:inline-flex"
                aria-label={user.name || user.email || t("nav.dashboard")}
              >
                <Avatar className="size-9 rounded-xl border border-white/40 shadow-sm">
                  <AvatarImage src={user.image ?? ""} alt={user.name} />
                  <AvatarFallback className="rounded-xl">
                    {user.name.charAt(0) || user.email.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline-block"
              >
                {t("landing2.nav.signin")}
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:shadow-lg"
              >
                {t("landing2.nav.startTrial")}
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground ml-2 flex size-10 items-center justify-center rounded-lg transition-colors md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-border bg-background/95 border-t backdrop-blur-lg md:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                {t("landing2.nav.signin")}
              </Link>
            )}
            <div className="flex items-center gap-2 px-3 pt-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

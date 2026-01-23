"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthButtonClient } from "../auth/auth-button-client";
import { LanguageToggle } from "../i18n/language-toggle";
import { ThemeToggle } from "../theme/theme-toggle";

export function MooddayHeader() {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t("moodday.nav.features"), href: "#features" },
    { label: t("moodday.nav.pricing"), href: "#pricing" },
    { label: t("moodday.nav.blog"), href: "/posts" },
    { label: t("moodday.nav.contact"), href: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          isScrolled ? "glass-card shadow-soft py-3" : "bg-transparent py-6",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <MooddayLogo />

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-primary text-sm font-medium text-gray-600 transition-colors dark:text-gray-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            <LanguageToggle />
            <ThemeToggle />
            <AuthButtonClient />
            <Link
              href="/auth/signup"
              className={cn(buttonVariants({ size: "sm" }), "rounded-xl px-4")}
            >
              {t("moodday.nav.getStarted")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded-xl bg-gray-100 md:hidden dark:bg-gray-800"
          >
            {isMobileMenuOpen ? (
              <X className="size-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="size-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="glass-card animate-in fade-in slide-in-from-top-2 fixed inset-x-0 top-[72px] z-40 border-t border-gray-100 p-6 duration-200 md:hidden dark:border-gray-800">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-gray-900 dark:text-gray-100"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100 dark:border-gray-800" />
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <ThemeToggle />
              <AuthButtonClient />
            </div>
            <Link
              href="/auth/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full rounded-xl",
              )}
            >
              {t("moodday.nav.getStartedFree")}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

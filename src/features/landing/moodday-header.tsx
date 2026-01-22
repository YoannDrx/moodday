"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarHeart, Menu, X } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { AuthButtonClient } from "../auth/auth-button-client";
import { ThemeToggle } from "../theme/theme-toggle";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Blog", href: "/posts" },
  { label: "Contact", href: "/contact" },
];

export function MooddayHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          isScrolled ? "glass-card shadow-soft py-3" : "bg-transparent py-6",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="bg-primary shadow-soft flex size-10 items-center justify-center rounded-xl transition-transform group-hover:rotate-6">
              <CalendarHeart className="size-5 text-white" />
            </div>
            <span className="text-primary text-xl font-bold tracking-tight">
              Moodday
            </span>
          </Link>

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
            <ThemeToggle />
            <AuthButtonClient />
            <Link
              href="/auth/signup"
              className={cn(buttonVariants({ size: "sm" }), "rounded-xl px-4")}
            >
              Commencer
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
      </motion.header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card fixed inset-x-0 top-[72px] z-40 border-t border-gray-100 p-6 md:hidden dark:border-gray-800"
        >
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
              Commencer gratuitement
            </Link>
          </nav>
        </motion.div>
      )}
    </>
  );
}

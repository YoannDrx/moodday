"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavbarMorph() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "Blog", href: "/posts" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center py-4">
      <nav
        className={cn(
          "navbar-morph flex items-center gap-2 px-4 py-2 transition-all duration-500",
          isScrolled && "scrolled",
        )}
      >
        <MooddayLogo />

        <div
          className={cn(
            "flex items-center gap-1 overflow-hidden transition-all duration-500",
            isScrolled ? "ml-4 max-w-[300px] opacity-100" : "max-w-0 opacity-0",
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-500",
            isScrolled ? "ml-2 max-w-[150px] opacity-100" : "max-w-0 opacity-0",
          )}
        >
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-full px-4 whitespace-nowrap",
            )}
          >
            Démarrer
          </Link>
        </div>
      </nav>
    </header>
  );
}

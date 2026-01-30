"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavbarMinimal() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/80 py-3 shadow-sm backdrop-blur-lg"
          : "bg-transparent py-6",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <MooddayLogo />

        <Link
          href="/auth/signup"
          className={cn(
            buttonVariants({ size: "sm" }),
            "rounded-full px-6 transition-all duration-300",
            isScrolled ? "bg-[#2BA09F]" : "bg-[#2BA09F]/90",
          )}
        >
          Commencer gratuitement
        </Link>
      </div>
    </header>
  );
}

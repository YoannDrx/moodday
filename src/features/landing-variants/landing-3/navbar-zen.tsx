"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function NavbarZen() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-1000",
        isScrolled ? "py-4" : "py-8",
      )}
    >
      <div
        className={cn(
          "transition-all duration-1000",
          isScrolled && "glass-zen rounded-full px-6 py-3 shadow-sm",
        )}
      >
        <MooddayLogo />
      </div>
    </header>
  );
}

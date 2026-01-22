"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { getPatientMobileNavigation } from "./patient-navigation.links";

export function PatientMobileNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const allLinks = getPatientMobileNavigation(t);

  // Split links: first 2, then the rest for after the center button
  const leftLinks = allLinks.slice(0, 2);
  const rightLinks = allLinks.slice(2, 4);

  return (
    <nav className="glass-card fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left navigation items */}
        {leftLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 transition-colors",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <link.Icon
                className={cn("size-6", isActive && "stroke-[2.5px]")}
              />
              <span
                className={cn(
                  "text-[10px] font-bold tracking-widest uppercase",
                  isActive && "relative",
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--primary)]" />
                )}
              </span>
            </Link>
          );
        })}

        {/* Center floating action button */}
        <Link
          href="/mood"
          className="shadow-soft -mt-8 flex size-14 items-center justify-center rounded-2xl border-4 border-[var(--warm-bg)] bg-[var(--primary)] text-white transition-transform active:scale-90"
        >
          <Plus className="size-8" />
        </Link>

        {/* Right navigation items */}
        {rightLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 transition-colors",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <link.Icon
                className={cn("size-6", isActive && "stroke-[2.5px]")}
              />
              <span
                className={cn(
                  "text-[10px] font-bold tracking-widest uppercase",
                  isActive && "relative",
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--primary)]" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPatientMobileNavigation } from "./patient-navigation.links";

export function PatientMobileNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const links = getPatientMobileNavigation(t);

  return (
    <nav className="glass-card fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-5 items-center px-2 py-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-gray-600 hover:text-gray-800",
              )}
            >
              <link.Icon
                className={cn("size-6", isActive && "stroke-[2.5px]")}
              />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-bold tracking-wide",
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

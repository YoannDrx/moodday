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
    <nav className="glass-card fixed right-0 bottom-0 left-0 z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-[var(--sidebar-patient-primary)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <link.Icon
                className={cn(
                  "size-5",
                  isActive && "text-[var(--sidebar-patient-primary)]",
                )}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

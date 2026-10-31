"use client";

import { cn } from "@/lib/utils";
import {
  CalendarHeart,
  GraduationCap,
  HeartHandshake,
  House,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppRole = "cycle_owner" | "supporter";

const itemsFor = (role: AppRole) =>
  role === "cycle_owner"
    ? [
        { href: "/today", label: "Aujourd'hui", icon: House },
        { href: "/cycle", label: "Cycle", icon: CalendarHeart },
        { href: "/duo", label: "Duo", icon: HeartHandshake },
        { href: "/ally", label: "Pour moi", icon: Sparkles },
      ]
    : [
        { href: "/today", label: "Aujourd'hui", icon: House },
        { href: "/cycle", label: "Son cycle", icon: CalendarHeart },
        { href: "/duo", label: "Duo", icon: HeartHandshake },
        { href: "/ally", label: "Allié", icon: GraduationCap },
      ];

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function AppSideNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation de l'application">
      <ul className="flex flex-col gap-2">
        {itemsFor(role).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-bold transition",
                  active
                    ? "bg-honey shadow-sticker border-[var(--ink)] text-[#2b1b30]"
                    : "hover:bg-accent border-transparent",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppBottomNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation de l'application"
      className="bg-paper fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--ink)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {itemsFor(role).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2 text-[11px] font-bold"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full border-2",
                    active
                      ? "bg-honey border-[var(--ink)] text-[#2b1b30]"
                      : "border-transparent",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

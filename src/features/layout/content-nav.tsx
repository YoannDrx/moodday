"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type ContentNavProps = {
  navItems: NavItem[];
};

export function ContentNav({ navItems }: ContentNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            asChild
            className={cn(isActive && "bg-accent")}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}

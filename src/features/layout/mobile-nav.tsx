"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuthButtonClient } from "@/features/auth/auth-button-client";
import { SiteConfig } from "@/site-config";
import { BookOpen, FileText, Menu, Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";

type NavItem = {
  href: string;
  label: string;
};

const iconMap: Record<string, typeof BookOpen> = {
  "/docs": BookOpen,
  "/posts": Newspaper,
  "/changelog": FileText,
};

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="size-5" />
          <span className="sr-only">{t("nav.menu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image
              src={SiteConfig.appIcon}
              alt={t("nav.logoAlt")}
              width={24}
              height={24}
              className="size-6"
            />
            {SiteConfig.title}
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = iconMap[item.href] ?? FileText;
            const isActive = pathname.startsWith(item.href);

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className="justify-start gap-3"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={item.href}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-8 border-t pt-6">
          <AuthButtonClient />
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { SiteConfig } from "@/site-config";
import Image from "next/image";
import Link from "next/link";
import { AuthButton } from "../auth/auth-button";
import { LanguageToggle } from "../i18n/language-toggle";
import { ContentNav } from "./content-nav";
import { MobileNav } from "./mobile-nav";
import { getI18n } from "@/i18n/server";

export async function ContentHeader() {
  const { t } = await getI18n();
  const navItems = [
    { href: "/docs", label: t("nav.docs") },
    { href: "/posts", label: t("nav.blog") },
    { href: "/changelog", label: t("nav.changelog") },
  ];

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={SiteConfig.appIcon}
              alt={t("nav.logoAlt")}
              width={32}
              height={32}
              className="size-8"
            />
            <span className="text-lg font-bold">{SiteConfig.title}</span>
          </Link>

          <ContentNav navItems={navItems} />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthButton />
          </div>
          <LanguageToggle />
          <MobileNav navItems={navItems} />
        </div>
      </div>
    </header>
  );
}

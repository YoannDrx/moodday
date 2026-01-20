import { SiteConfig } from "@/site-config";
import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Layout } from "../page/layout";
import { LanguageToggle } from "../i18n/language-toggle";
import { ThemeToggle } from "../theme/theme-toggle";
import { getI18n } from "@/i18n/server";

export async function HeaderBase({ children }: PropsWithChildren) {
  const { t } = await getI18n();

  return (
    <header className="bg-card sticky top-0 z-50 flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
      <Layout className="my-2">
        <div className="flex items-center gap-2">
          <Image
            src={SiteConfig.appIcon}
            alt={t("nav.logoAlt")}
            width={32}
            height={32}
          />
          <Link href="/" className="text-base font-bold">
            {SiteConfig.title}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {children}
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </div>
      </Layout>
    </header>
  );
}

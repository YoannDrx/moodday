"use client";

import { Button } from "@/components/ui/button";
import { Layout, LayoutContent } from "@/features/page/layout";
import { useI18n } from "@/i18n/provider";
import { SiteConfig } from "@/site-config";
import Link from "next/link";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-background border-t pb-8">
      <Layout className="my-14">
        <LayoutContent>
          <div className="flex flex-col gap-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold tracking-tight">
                  {SiteConfig.title}
                </h3>
                <p className="text-muted-foreground max-w-xs text-sm">
                  {t("footer.description")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                <div className="flex flex-col gap-3">
                  <h4 className="font-medium">{t("footer.product")}</h4>
                  <nav className="flex flex-col gap-2">
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/posts">{t("footer.blog")}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/guides">{t("footer.guides")}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/orgs">{t("footer.dashboard")}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/settings?tab=profile">
                        {t("footer.account")}
                      </Link>
                    </Button>
                  </nav>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="font-medium">{t("footer.company")}</h4>
                  <nav className="flex flex-col gap-2">
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/about">{t("footer.about")}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/contact">{t("footer.contact")}</Link>
                    </Button>
                  </nav>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="font-medium">{t("footer.legal")}</h4>
                  <nav className="flex flex-col gap-2">
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/legal/terms">{t("footer.terms")}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto justify-start p-0"
                    >
                      <Link href="/legal/privacy">{t("footer.privacy")}</Link>
                    </Button>
                  </nav>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-8 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm">
                  {SiteConfig.company.name} · {SiteConfig.company.legalForm} ·
                  SIREN {SiteConfig.company.siren}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("footer.rights", {
                    year: new Date().getFullYear(),
                    company: SiteConfig.company.name,
                  })}
                </p>
              </div>
            </div>
          </div>
        </LayoutContent>
      </Layout>
    </footer>
  );
}

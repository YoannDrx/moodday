"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { useI18n } from "@/i18n/provider";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export function FooterDark() {
  const { t } = useI18n();

  const footerLinks = {
    [t("landing2.footer.links.product.title")]: [
      { label: t("landing2.footer.links.product.features"), href: "#features" },
      { label: t("landing2.footer.links.product.pricing"), href: "#pricing" },
      { label: t("landing2.footer.links.product.security"), href: "#security" },
    ],
    [t("landing2.footer.links.resources.title")]: [
      { label: t("landing2.footer.links.resources.blog"), href: "/posts" },
      { label: t("landing2.footer.links.resources.guides"), href: "/guides" },
    ],
    [t("landing2.footer.links.company.title")]: [
      { label: t("landing2.footer.links.company.about"), href: "/about" },
      { label: t("landing2.footer.links.company.contact"), href: "/contact" },
      { label: t("landing2.footer.links.company.careers"), href: "/careers" },
    ],
    [t("landing2.footer.links.legal.title")]: [
      {
        label: t("landing2.footer.links.legal.privacy"),
        href: "/legal/privacy",
      },
      { label: t("landing2.footer.links.legal.terms"), href: "/legal/terms" },
      {
        label: t("landing2.footer.links.legal.cookies"),
        href: "/legal/cookies",
      },
    ],
  };

  return (
    <footer className="border-border bg-background border-t py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <MooddayLogo />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              {t("landing2.footer.description")}
            </p>
            <div className="mt-6 flex gap-4">
              <div className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors">
                <Instagram className="size-5" />
              </div>
              <div className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors">
                <Linkedin className="size-5" />
              </div>
              <div className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors">
                <Facebook className="size-5" />
              </div>
              <div className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors">
                <Twitter className="size-5" />
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-muted-foreground text-sm">
            {t("landing2.footer.copyright", {
              year: new Date().getFullYear().toString(),
            })}
          </p>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            {t("landing2.footer.status")}
          </div>
        </div>
      </div>
    </footer>
  );
}

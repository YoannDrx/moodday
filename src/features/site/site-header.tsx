"use client";

import { MooddayLogo } from "@/components/brand/moodday-logo";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const links = [
  { label: "Comment ça marche", href: "/#comment" },
  { label: "Pour les partenaires", href: "/#partenaires" },
  { label: "Guides SPM", href: "/posts" },
  { label: "Confidentialité", href: "/#confiance" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b-2 border-[var(--ink)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Accueil Moodday">
          <MooddayLogo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:bg-accent rounded-full px-3 py-2 text-sm font-semibold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/today" className={buttonVariants({ size: "sm" })}>
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "hidden sm:inline-flex",
                )}
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                className={buttonVariants({ size: "sm" })}
              >
                Commencer
              </Link>
            </>
          )}
          <button
            type="button"
            className="hover:bg-accent rounded-full p-2 md:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="site-menu"
          aria-label="Navigation mobile"
          className="border-t-2 border-[var(--ink)] px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {[...links, { label: "Connexion", href: "/auth/signin" }].map(
              (link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="hover:bg-accent block rounded-xl px-3 py-3 font-semibold"
                  >
                    {link.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

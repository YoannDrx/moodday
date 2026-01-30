import { MooddayLogo } from "@/components/nowts/moodday-logo";
import Link from "next/link";

export function FooterMinimal() {
  const links = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "Blog", href: "/posts" },
    { label: "Contact", href: "/contact" },
    { label: "Confidentialité", href: "/legal/privacy" },
    { label: "CGU", href: "/legal/terms" },
  ];

  return (
    <footer className="border-t border-gray-100 bg-[#F8F7F3] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <MooddayLogo />

          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 transition-colors hover:text-[#2BA09F]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Moodday. Tous droits réservés.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Fait avec soin pour votre bien-être mental.
          </p>
        </div>
      </div>
    </footer>
  );
}

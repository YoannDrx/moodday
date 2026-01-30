import { MooddayLogo } from "@/components/nowts/moodday-logo";
import Link from "next/link";

export function FooterLayered() {
  const footerLinks = {
    Produit: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
    Ressources: [
      { label: "Blog", href: "/posts" },
      { label: "Documentation", href: "/docs" },
      { label: "Contact", href: "/contact" },
    ],
    Légal: [
      { label: "Confidentialité", href: "/legal/privacy" },
      { label: "CGU", href: "/legal/terms" },
    ],
  };

  return (
    <footer className="relative overflow-hidden bg-gray-900 py-16">
      {/* Layered depth effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2BA09F]/50 to-transparent" />
        <div className="bg-radial-primary absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <MooddayLogo />
            <p className="mt-4 max-w-xs text-gray-400">
              Prenez soin de votre santé mentale avec des outils modernes,
              sécurisés et respectueux de votre vie privée.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold text-white">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-[#3DA5B8]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Moodday. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="size-2 animate-pulse rounded-full bg-[#48A878]" />
            Tous les systèmes opérationnels
          </div>
        </div>
      </div>
    </footer>
  );
}

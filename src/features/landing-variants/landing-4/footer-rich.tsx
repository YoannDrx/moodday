"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import Link from "next/link";
import { useState } from "react";
import { Send } from "lucide-react";

export function FooterRich() {
  const [email, setEmail] = useState("");

  const footerLinks = {
    Produit: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/contact" },
    ],
    Ressources: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/posts" },
      { label: "Guides", href: "/docs" },
    ],
    Entreprise: [
      { label: "À propos", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    Légal: [
      { label: "Confidentialité", href: "/legal/privacy" },
      { label: "CGU", href: "/legal/terms" },
    ],
  };

  return (
    <footer className="border-t border-gray-100 bg-[#F8F7F3] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left - Newsletter */}
          <div>
            <MooddayLogo />
            <p className="mt-4 max-w-sm text-gray-600">
              Recevez nos conseils bien-être et les dernières mises à jour
              directement dans votre boîte mail.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 flex max-w-sm gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#2BA09F] focus:ring-1 focus:ring-[#2BA09F] focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-xl bg-[#2BA09F] px-4 text-white transition-colors hover:bg-[#2A8FA8]"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>

          {/* Right - Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 transition-colors hover:text-[#2BA09F]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Moodday. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 transition-colors hover:text-[#2BA09F]"
            >
              Twitter
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 transition-colors hover:text-[#2BA09F]"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 transition-colors hover:text-[#2BA09F]"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { CalendarHeart, Phone } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Sécurité", href: "/security" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  resources: {
    title: "Ressources",
    links: [
      { label: "Blog", href: "/posts" },
      { label: "Guides", href: "/docs" },
      { label: "Aide", href: "/help" },
      { label: "Contact", href: "/contact" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { label: "Conditions", href: "/legal/terms" },
      { label: "Confidentialité", href: "/legal/privacy" },
      { label: "RGPD", href: "/legal/gdpr" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
  },
};

export function MooddayFooter() {
  return (
    <footer className="relative border-t border-gray-100 bg-white/50 dark:border-gray-800 dark:bg-gray-900/50">
      {/* Emergency Banner */}
      <div className="border-b border-red-100 bg-red-50/50 py-3 dark:border-red-900/30 dark:bg-red-900/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-6 text-sm lg:px-8">
          <span className="font-semibold text-red-600 dark:text-red-400">
            Besoin d&apos;aide urgente ?
          </span>
          <a
            href="tel:3114"
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-1.5 font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50"
          >
            <Phone className="size-4" />
            3114 - Numéro national de prévention du suicide
          </a>
          <span className="text-xs text-red-500 dark:text-red-400">
            Gratuit et confidentiel, 24h/24
          </span>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-2">
              <div className="bg-primary shadow-soft flex size-10 items-center justify-center rounded-xl transition-transform group-hover:rotate-6">
                <CalendarHeart className="size-5 text-white" />
              </div>
              <span className="text-primary text-xl font-bold tracking-tight">
                Moodday
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              Votre compagnon digital pour suivre votre parcours de santé
              mentale. Conçu avec des professionnels de santé.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Moodday est un outil de suivi, pas un dispositif médical. En cas
              de détresse, contactez un professionnel de santé.
            </p>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-100">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-primary text-sm text-gray-600 transition-colors dark:text-gray-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 md:flex-row dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Moodday SAS. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="https://twitter.com/moodday"
              className="hover:text-primary text-gray-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
            <Link
              href="https://linkedin.com/company/moodday"
              className="hover:text-primary text-gray-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">LinkedIn</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </Link>
            <Link
              href="https://instagram.com/moodday"
              className="hover:text-primary text-gray-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Instagram</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

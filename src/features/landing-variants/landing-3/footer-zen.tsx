import Link from "next/link";

export function FooterZen() {
  const links = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "Blog", href: "/posts" },
    { label: "Contact", href: "/contact" },
    { label: "Confidentialité", href: "/legal/privacy" },
    { label: "CGU", href: "/legal/terms" },
  ];

  return (
    <footer className="zen border-t border-[#E3D5C2] bg-[#F4F1EA] py-12">
      <div className="mx-auto max-w-4xl px-6">
        <nav className="flex flex-wrap items-center justify-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#7A8075] transition-colors duration-500 hover:text-[#3C8D7C]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 text-center">
          <p className="font-serif text-sm text-[#7A8075]">
            © {new Date().getFullYear()} Moodday
          </p>
        </div>
      </div>
    </footer>
  );
}

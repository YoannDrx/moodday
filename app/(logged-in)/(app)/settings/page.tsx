import { getFeatureAvailability } from "@/lib/features/availability";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Palette,
  ShieldCheck,
  User,
  Database,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Réglages" };

export default function SettingsPage() {
  const sections = [
    {
      href: "/settings/profile",
      label: "Profil",
      hint: "Prénom, photo, fuseau horaire",
      icon: User,
    },
    ...(getFeatureAvailability("pushNotifications").enabled
      ? [
          {
            href: "/settings/notifications",
            label: "Notifications",
            hint: "Rappel du point, heures calmes",
            icon: Bell,
          },
        ]
      : []),
    {
      href: "/settings/security",
      label: "Sécurité",
      hint: "Mot de passe, double authentification, passkeys",
      icon: ShieldCheck,
    },
    {
      href: "/settings/privacy",
      label: "Mes données",
      hint: "Export, suppression du compte",
      icon: Database,
    },
    {
      href: "/settings/appearance",
      label: "Apparence",
      hint: "Clair, sombre, animations",
      icon: Palette,
    },
    {
      href: "/settings/subscription",
      label: "Abonnement Duo",
      hint: "Un abonnement pour vous deux",
      icon: CreditCard,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Réglages</h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="sticker sticker-hover flex items-center gap-4 p-5"
            >
              <span className="bg-honey-soft flex size-12 items-center justify-center rounded-2xl border-2 border-[var(--ink)]">
                <section.icon className="size-6" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-bold">{section.label}</span>
                <span className="text-muted-foreground text-sm">
                  {section.hint}
                </span>
              </span>
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

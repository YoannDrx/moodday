"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, Pill, Users, FileText, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavbarMegamenu() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <TrendingUp className="size-5 text-[#2BA09F]" />,
      title: "Suivi d'humeur",
      description: "Enregistrez et visualisez vos émotions",
    },
    {
      icon: <Pill className="size-5 text-[#48A878]" />,
      title: "Médicaments",
      description: "Rappels et tracking d'adhérence",
    },
    {
      icon: <Users className="size-5 text-[#B8A5D6]" />,
      title: "Cercle d'aidants",
      description: "Partagez avec vos proches",
    },
    {
      icon: <FileText className="size-5 text-[#2BA09F]" />,
      title: "Export PDF",
      description: "Rapports pour vos consultations",
    },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 py-3 shadow-sm backdrop-blur-lg"
          : "bg-transparent py-6",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <MooddayLogo />

        <nav className="hidden items-center gap-1 md:flex">
          {/* Mega menu trigger */}
          <div
            className="relative"
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            <button className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
              Fonctionnalités
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  showMegaMenu && "rotate-180",
                )}
              />
            </button>

            {/* Mega menu */}
            {showMegaMenu && (
              <div className="absolute top-full left-0 mt-2 w-[400px] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature, idx) => (
                    <Link
                      key={idx}
                      href="#features"
                      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="mt-0.5 rounded-lg bg-gray-100 p-2 transition-colors group-hover:bg-white">
                        {feature.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {feature.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="#pricing"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Tarifs
          </Link>
          <Link
            href="/posts"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Connexion
          </Link>
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-xl px-5 shadow-lg shadow-[#2BA09F]/20",
            )}
          >
            Démarrer
          </Link>
        </div>
      </div>
    </header>
  );
}

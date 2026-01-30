"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export function HeroCompact() {
  return (
    <section className="relative overflow-hidden bg-[#F8F7F3] pt-32 pb-12">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2BA09F]/5 via-transparent to-[#D4C5E8]/10" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#2BA09F]/10 px-4 py-2">
            <span className="size-2 animate-pulse rounded-full bg-[#2BA09F]" />
            <span className="text-sm font-medium text-[#2BA09F]">
              Nouveau : Insights IA disponibles
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Votre bien-être mental,{" "}
            <span className="bg-gradient-to-r from-[#2BA09F] to-[#48A878] bg-clip-text text-transparent">
              simplifié
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-lg text-gray-600">
            Suivez votre humeur, gérez vos médicaments, partagez avec vos
            aidants. Tout en un seul endroit, sécurisé et respectueux de votre
            vie privée.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 rounded-2xl px-8 shadow-lg shadow-[#2BA09F]/25",
              )}
            >
              Commencer gratuitement
              <ArrowRight className="size-4" />
            </Link>
            <button className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-300 hover:shadow-md">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#2BA09F]/10 transition-colors group-hover:bg-[#2BA09F]/20">
                <Play className="size-3 fill-[#2BA09F] text-[#2BA09F]" />
              </div>
              Voir la démo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

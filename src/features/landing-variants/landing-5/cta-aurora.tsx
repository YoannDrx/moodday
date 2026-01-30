"use client";

import { ScrollReveal, GlowButton } from "../shared";
import { ArrowRight } from "lucide-react";

export function CtaAurora() {
  return (
    <section className="relative overflow-hidden py-32">
      {/* Aurora background */}
      <div className="animate-aurora absolute inset-0 bg-gradient-to-br from-[#2BA09F]/30 via-[#48A878]/20 via-[#D4C5E8]/30 to-[#2BA09F]/20" />

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <h2 className="mb-6 text-4xl font-bold text-gray-900 text-shadow-lg md:text-5xl lg:text-6xl">
            Prêt à transformer votre
            <br />
            <span className="bg-gradient-to-r from-[#2BA09F] to-[#48A878] bg-clip-text text-transparent">
              bien-être mental
            </span>{" "}
            ?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">
            Rejoignez des milliers d&apos;utilisateurs qui ont repris le
            contrôle de leur santé mentale. Gratuit pour commencer, sans
            engagement.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GlowButton
              href="/auth/signup"
              variant="primary"
              size="lg"
              glowIntensity="strong"
            >
              Commencer gratuitement
              <ArrowRight className="size-5" />
            </GlowButton>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={600}>
          <p className="mt-6 text-sm text-gray-500">
            Aucune carte bancaire requise • Annulez à tout moment
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

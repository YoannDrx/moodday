"use client";

import { ScrollReveal, GlowButton } from "../shared";
import { ArrowRight, Shield, Heart } from "lucide-react";

export function CtaStorytelling() {
  return (
    <section className="relative overflow-hidden bg-[#F8F7F3] py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blur-4xl absolute -top-40 -left-40 size-80 rounded-full bg-[#D4C5E8]/20" />
        <div className="blur-4xl absolute -right-40 -bottom-40 size-80 rounded-full bg-[#2BA09F]/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <h2 className="mb-6 font-serif text-4xl font-light text-gray-800 md:text-5xl">
            Prêt à commencer{" "}
            <span className="bg-gradient-to-r from-[#2BA09F] to-[#48A878] bg-clip-text font-medium text-transparent">
              votre histoire
            </span>{" "}
            ?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-500">
            Rejoignez des milliers de personnes qui ont repris le contrôle de
            leur bien-être mental. Votre premier chapitre commence
            aujourd&apos;hui.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GlowButton
              href="/auth/signup"
              variant="primary"
              size="lg"
              glowIntensity="medium"
            >
              Commencer gratuitement
              <ArrowRight className="size-5" />
            </GlowButton>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={600}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-[#48A878]" />
              <span>Données chiffrées</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-rose-400" />
              <span>Conforme RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#2BA09F]">✓</span>
              <span>Gratuit pour commencer</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

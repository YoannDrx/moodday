"use client";

import { ScrollReveal } from "../shared";

export function SectionWater() {
  return (
    <section className="zen min-h-screen bg-[#EFE7DB] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* Left - Text */}
          <div className="order-2 space-y-8 lg:order-1">
            <ScrollReveal duration={1500} direction="left">
              <p className="text-sm tracking-[0.3em] text-[#7A8075] uppercase">
                Couler
              </p>
            </ScrollReveal>

            <ScrollReveal duration={1500} direction="left" delay={200}>
              <h2 className="font-serif text-4xl leading-relaxed font-extralight text-[#2F3B33] md:text-5xl">
                Suivez le flux
                <br />
                <span className="text-[#3C8D7C]">de votre quotidien.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal duration={1500} direction="left" delay={400}>
              <p className="max-w-md text-lg leading-relaxed text-[#7A8075]">
                L&apos;eau s&apos;adapte, contourne les obstacles, trouve son
                chemin. Vos traitements, vos routines, vos rendez-vous – tout
                coule naturellement avec Moodday.
              </p>
            </ScrollReveal>
          </div>

          {/* Right - Illustration */}
          <ScrollReveal
            duration={1500}
            direction="right"
            className="order-1 lg:order-2"
          >
            <div className="relative flex aspect-square items-center justify-center">
              {/* Water ripples - concentric circles */}
              <div
                className="absolute size-full animate-ping rounded-full border border-[#3C8D7C]/10 opacity-75"
                style={{ animationDuration: "4s" }}
              />
              <div
                className="absolute size-3/4 animate-ping rounded-full border border-[#3C8D7C]/15 opacity-75"
                style={{ animationDuration: "4s", animationDelay: "1s" }}
              />
              <div
                className="absolute size-1/2 animate-ping rounded-full border border-[#3C8D7C]/20 opacity-75"
                style={{ animationDuration: "4s", animationDelay: "2s" }}
              />
              <div
                className="absolute size-1/4 animate-ping rounded-full border border-[#3C8D7C]/25 opacity-75"
                style={{ animationDuration: "4s", animationDelay: "3s" }}
              />

              {/* Center drop */}
              <div className="relative z-10 size-8 rounded-full bg-gradient-to-br from-[#3C8D7C] to-[#5C8B6B] shadow-lg" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

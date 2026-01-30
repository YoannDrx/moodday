"use client";

import { ScrollReveal } from "../shared";
import { ArrowDown } from "lucide-react";

export function HeroStorytelling() {
  const scrollToNext = () => {
    const nextSection = document.getElementById("section-morning");
    nextSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#F8F7F3] to-[#EDE8F5]">
      {/* Soft blob backgrounds */}
      <div className="blur-4xl absolute -top-40 -right-40 size-[600px] rounded-full bg-[#D4C5E8]/30" />
      <div className="blur-4xl absolute -bottom-40 -left-40 size-[500px] rounded-full bg-[#2BA09F]/10" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal delay={0} duration={800}>
          <p className="mb-6 font-serif text-lg text-[#B8A5D6] italic">
            Une histoire de transformation
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200} duration={800}>
          <h1 className="mb-8 font-serif text-4xl leading-tight font-light text-gray-800 md:text-6xl lg:text-7xl">
            Bonjour, je suis{" "}
            <span className="bg-gradient-to-r from-[#2BA09F] to-[#48A878] bg-clip-text font-medium text-transparent">
              Marie
            </span>
            .
            <br />
            <span className="mt-2 block text-3xl text-gray-600 md:text-5xl lg:text-6xl">
              Voici comment Moodday a changé ma vie.
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={400} duration={800}>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-500 md:text-xl">
            Vivant avec un trouble bipolaire depuis 5 ans, j&apos;ai longtemps
            cherché un moyen de mieux comprendre mes cycles émotionnels. Suivez
            mon parcours, du lever au coucher.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={600} duration={800}>
          <button
            onClick={scrollToNext}
            className="group inline-flex flex-col items-center gap-2 text-[#2BA09F] transition-colors hover:text-[#1D7680]"
          >
            <span className="text-sm font-medium">Découvrir mon histoire</span>
            <ArrowDown className="size-6 animate-bounce" />
          </button>
        </ScrollReveal>
      </div>

      {/* Character illustration placeholder */}
      <div className="absolute right-0 bottom-0 hidden h-[400px] w-[300px] opacity-20 lg:block">
        <div className="size-full rounded-tl-[200px] bg-gradient-to-t from-[#D4C5E8]/50 to-transparent" />
      </div>
    </section>
  );
}

"use client";

import { ScrollReveal } from "../shared";

export function HeroZen() {
  return (
    <section className="zen relative flex min-h-screen items-center justify-center bg-[#F4F1EA]">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal duration={1500}>
          <h1 className="font-serif text-5xl font-extralight tracking-wide text-[#2F3B33] md:text-7xl lg:text-8xl">
            Prenez soin
            <br />
            <span className="text-[#3C8D7C]">de vous.</span>
          </h1>
        </ScrollReveal>

        {/* Animated circle */}
        <ScrollReveal delay={800} duration={2000}>
          <div className="mx-auto mt-20">
            <div className="relative mx-auto size-32">
              {/* Outer ring - slow rotation */}
              <div className="animate-spin-slow absolute inset-0 rounded-full border border-[#3C8D7C]/20" />
              {/* Middle ring */}
              <div
                className="animate-spin-slow absolute inset-4 rounded-full border border-[#3C8D7C]/30"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "30s",
                }}
              />
              {/* Inner circle */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#3C8D7C]/20 to-[#5C8B6B]/10" />
              {/* Center dot */}
              <div className="absolute inset-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3C8D7C]" />
            </div>
          </div>
        </ScrollReveal>

        {/* Scroll indicator */}
        <ScrollReveal delay={1500} duration={2000}>
          <div className="mt-20">
            <p className="text-sm tracking-[0.3em] text-[#7A8075] uppercase">
              Descendez
            </p>
            <div className="mx-auto mt-4 h-12 w-px bg-gradient-to-b from-[#3C8D7C]/50 to-transparent" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

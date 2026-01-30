"use client";

import { ScrollReveal } from "../shared";

export function SectionStone() {
  return (
    <section className="zen min-h-screen bg-[#F4F1EA] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* Left - Illustration */}
          <ScrollReveal duration={1500} direction="left">
            <div className="relative flex aspect-square items-center justify-center">
              {/* Stone representation - abstract circles */}
              <div className="absolute size-64 rounded-full bg-gradient-to-br from-[#CCC5B8] to-[#B8AFA0] shadow-lg" />
              <div className="absolute top-1/4 right-1/4 size-32 rounded-full bg-gradient-to-br from-[#D4CDC0] to-[#C5BDB0]" />
              <div className="absolute bottom-1/3 left-1/3 size-20 rounded-full bg-gradient-to-br from-[#E3DCD0] to-[#D4CCC0]" />

              {/* Subtle ripples */}
              <div className="animate-pulse-soft absolute inset-0 rounded-full border border-[#3C8D7C]/10" />
            </div>
          </ScrollReveal>

          {/* Right - Text */}
          <div className="space-y-8">
            <ScrollReveal duration={1500} direction="right">
              <p className="text-sm tracking-[0.3em] text-[#7A8075] uppercase">
                Observer
              </p>
            </ScrollReveal>

            <ScrollReveal duration={1500} direction="right" delay={200}>
              <h2 className="font-serif text-4xl leading-relaxed font-extralight text-[#2F3B33] md:text-5xl">
                Observez vos émotions
                <br />
                <span className="text-[#3C8D7C]">sans jugement.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal duration={1500} direction="right" delay={400}>
              <p className="max-w-md text-lg leading-relaxed text-[#7A8075]">
                Comme une pierre dans un jardin zen, vos émotions existent
                simplement. Moodday vous aide à les observer, les comprendre, et
                les accepter.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

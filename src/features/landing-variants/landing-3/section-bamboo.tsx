"use client";

import { ScrollReveal } from "../shared";

export function SectionBamboo() {
  return (
    <section className="zen min-h-screen bg-[#F4F1EA] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* Left - Illustration */}
          <ScrollReveal duration={1500} direction="left">
            <div className="relative flex aspect-square items-center justify-center">
              {/* Bamboo representation - vertical lines */}
              <div className="flex h-full items-end justify-center gap-4">
                {[0.6, 0.85, 1, 0.75, 0.5].map((height, idx) => (
                  <div
                    key={idx}
                    className="w-3 rounded-t-full bg-gradient-to-t from-[#5C8B6B] to-[#7FA98D] transition-all duration-1000"
                    style={{
                      height: `${height * 100}%`,
                      animationDelay: `${idx * 0.2}s`,
                    }}
                  />
                ))}
              </div>

              {/* Subtle leaves */}
              <div className="absolute top-1/4 right-1/4 size-12 rotate-45 rounded-full bg-[#7FA98D]/30" />
              <div className="absolute top-1/3 left-1/3 size-8 -rotate-12 rounded-full bg-[#7FA98D]/20" />
            </div>
          </ScrollReveal>

          {/* Right - Text */}
          <div className="space-y-8">
            <ScrollReveal duration={1500} direction="right">
              <p className="text-sm tracking-[0.3em] text-[#7A8075] uppercase">
                Grandir
              </p>
            </ScrollReveal>

            <ScrollReveal duration={1500} direction="right" delay={200}>
              <h2 className="font-serif text-4xl leading-relaxed font-extralight text-[#2F3B33] md:text-5xl">
                Grandissez
                <br />
                <span className="text-[#3C8D7C]">jour après jour.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal duration={1500} direction="right" delay={400}>
              <p className="max-w-md text-lg leading-relaxed text-[#7A8075]">
                Le bambou plie mais ne rompt pas. Avec le temps et la constance,
                vous développez une résilience profonde. Moodday vous accompagne
                dans cette croissance.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

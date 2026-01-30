"use client";

import { ScrollReveal } from "../shared";

export function TestimonialZen() {
  return (
    <section className="zen min-h-[60vh] bg-[#F4F1EA] py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <ScrollReveal duration={2000}>
          <blockquote>
            <p className="font-serif text-2xl leading-relaxed font-extralight text-[#2F3B33] md:text-4xl">
              &ldquo;Moodday m&apos;a appris à accueillir mes émotions avec
              douceur. Chaque jour est une nouvelle page, et je la remplis avec
              bienveillance.&rdquo;
            </p>
          </blockquote>

          <footer className="mt-12">
            <div className="mx-auto mb-4 size-1 rounded-full bg-[#3C8D7C]" />
            <p className="font-serif text-lg text-[#3C8D7C]">Sophie M.</p>
            <p className="text-sm text-[#7A8075]">Utilisatrice depuis 8 mois</p>
          </footer>
        </ScrollReveal>
      </div>
    </section>
  );
}

"use client";

import { ScrollReveal } from "../shared";
import Link from "next/link";

export function CtaZen() {
  return (
    <section className="zen min-h-[50vh] bg-[#F4F1EA] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <ScrollReveal duration={1500}>
          <Link
            href="/auth/signup"
            className="group inline-block rounded-full border border-[#3C8D7C] px-12 py-4 transition-all duration-700 hover:bg-[#3C8D7C]"
          >
            <span className="font-serif text-lg font-light text-[#3C8D7C] transition-colors duration-700 group-hover:text-white">
              Essayer gratuitement
            </span>
          </Link>
        </ScrollReveal>

        <ScrollReveal duration={1500} delay={500}>
          <p className="mt-8 text-sm text-[#7A8075]">
            Aucune carte bancaire requise
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

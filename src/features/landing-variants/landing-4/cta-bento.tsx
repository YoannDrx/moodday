"use client";

import { ScrollReveal, GlowButton } from "../shared";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

export function CtaBento() {
  const [email, setEmail] = useState("");

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2BA09F] to-[#48A878] p-8 md:p-12">
            {/* Background decoration */}
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Prêt à prendre soin de vous ?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-white/80">
                Rejoignez des milliers d&apos;utilisateurs qui ont transformé
                leur relation avec leur santé mentale.
              </p>

              {/* Email form */}
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full rounded-xl border-0 bg-white py-4 pr-4 pl-12 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 focus:outline-none"
                  />
                </div>
                <GlowButton
                  variant="dark"
                  size="lg"
                  glowIntensity="strong"
                  type="submit"
                >
                  Commencer
                  <ArrowRight className="size-4" />
                </GlowButton>
              </form>

              <p className="mt-4 text-sm text-white/60">
                Gratuit pour toujours. Pas de carte bancaire requise.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

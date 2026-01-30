"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "../shared";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function PricingBento() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Gratuit",
      price: { monthly: 0, annual: 0 },
      description: "Pour découvrir Moodday",
      features: [
        "Suivi d'humeur illimité",
        "3 médicaments",
        "Historique 30 jours",
      ],
      highlighted: false,
    },
    {
      name: "Pro",
      price: { monthly: 9.99, annual: 7.99 },
      description: "Pour un suivi complet",
      features: [
        "Tout du Gratuit",
        "Médicaments illimités",
        "Historique illimité",
        "Insights IA",
        "Cercle d'aidants",
        "Export PDF pro",
      ],
      highlighted: true,
    },
    {
      name: "Famille",
      price: { monthly: 19.99, annual: 14.99 },
      description: "Pour toute la famille",
      features: [
        "Tout du Pro",
        "5 comptes",
        "Dashboard famille",
        "Support prioritaire",
      ],
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Tarifs simples et transparents
            </h2>
            <p className="mb-8 text-gray-600">
              Commencez gratuitement, évoluez selon vos besoins
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  !isAnnual
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500",
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  isAnnual
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500",
                )}
              >
                Annuel
                <span className="rounded bg-[#48A878] px-1.5 py-0.5 text-xs text-white">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} direction="up">
              <div
                className={cn(
                  "relative rounded-3xl p-6 transition-all duration-300",
                  plan.highlighted
                    ? "border-2 border-[#2BA09F] bg-gradient-to-b from-[#2BA09F]/5 to-transparent shadow-xl shadow-[#2BA09F]/10"
                    : "border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg",
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-[#2BA09F] px-3 py-1 text-xs font-semibold text-white shadow-lg">
                      <Sparkles className="size-3" />
                      Populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-1 text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {isAnnual ? plan.price.annual : plan.price.monthly}€
                  </span>
                  <span className="text-gray-500">/mois</span>
                </div>

                <Link
                  href="/auth/signup"
                  className={cn(
                    "mb-6 block w-full rounded-xl py-3 text-center font-semibold transition-all",
                    plan.highlighted
                      ? "bg-[#2BA09F] text-white shadow-lg shadow-[#2BA09F]/25 hover:bg-[#2A8FA8]"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200",
                  )}
                >
                  {plan.price.monthly === 0 ? "Commencer" : "Essai gratuit"}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check className="size-4 text-[#48A878]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

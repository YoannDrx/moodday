"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal, AnimatedCounter } from "../shared";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Pricing3D() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>("pro");

  const plans = [
    {
      id: "free",
      name: "Gratuit",
      price: 0,
      description: "Pour découvrir Moodday",
      features: [
        "Suivi d'humeur illimité",
        "3 médicaments",
        "Historique 30 jours",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 7.99,
      description: "Pour un suivi complet",
      features: [
        "Tout du Gratuit",
        "Médicaments illimités",
        "Historique illimité",
        "Insights IA",
        "Cercle d'aidants",
        "Export PDF pro",
      ],
      popular: true,
    },
    {
      id: "family",
      name: "Famille",
      price: 14.99,
      description: "Pour toute la famille",
      features: [
        "Tout du Pro",
        "5 comptes",
        "Dashboard famille",
        "Support prioritaire",
      ],
    },
  ];

  return (
    <section id="pricing" className="bg-[#F8F7F3] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Investissez dans votre bien-être
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Des tarifs simples, sans engagement. Commencez gratuitement.
            </p>
          </div>
        </ScrollReveal>

        <div className="perspective-1000 grid gap-8 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <ScrollReveal key={plan.id} delay={idx * 100}>
              <div
                className={cn(
                  "preserve-3d relative rounded-3xl border bg-white p-8 transition-all duration-500",
                  hoveredPlan === plan.id
                    ? "z-10 scale-105 border-[#2BA09F] shadow-2xl shadow-[#2BA09F]/20"
                    : "border-gray-100 shadow-lg",
                  plan.popular &&
                    hoveredPlan !== plan.id &&
                    "border-[#2BA09F]/30",
                )}
                style={{
                  transform:
                    hoveredPlan === plan.id
                      ? "translateZ(30px)"
                      : "translateZ(0)",
                }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan("pro")}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#2BA09F] to-[#48A878] px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
                      <Sparkles className="size-3" />
                      Recommandé
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
                    {plan.price === 0 ? (
                      "0€"
                    ) : (
                      <>
                        <AnimatedCounter
                          end={plan.price}
                          decimals={2}
                          duration={1500}
                        />
                        €
                      </>
                    )}
                  </span>
                  <span className="text-gray-500">/mois</span>
                </div>

                <Link
                  href="/auth/signup"
                  className={cn(
                    "mb-6 block w-full rounded-xl py-3 text-center font-semibold transition-all",
                    plan.popular || hoveredPlan === plan.id
                      ? "bg-gradient-to-r from-[#2BA09F] to-[#48A878] text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200",
                  )}
                >
                  {plan.price === 0 ? "Commencer" : "Essai gratuit 14j"}
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

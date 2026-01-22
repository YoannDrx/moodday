"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Heart, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Gratuit",
    description: "Pour commencer votre parcours",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Suivi humeur quotidien",
      "Journal illimité",
      "Historique 30 jours",
      "1 médicament suivi",
      "Export basique",
    ],
    cta: "Commencer gratuitement",
    ctaLink: "/auth/signup?plan=free",
    popular: false,
    icon: Heart,
  },
  {
    name: "Premium",
    description: "Pour un suivi complet",
    price: { monthly: 4.99, yearly: 39.99 },
    features: [
      "Tout du plan Gratuit",
      "Historique illimité",
      "Médicaments illimités",
      "Analyses avancées",
      "Export PDF médical",
      "Rappels personnalisés",
      "Cercle de 2 aidants",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    ctaLink: "/auth/signup?plan=premium",
    popular: true,
    icon: Sparkles,
  },
  {
    name: "Famille",
    description: "Pour vous et vos proches",
    price: { monthly: 9.99, yearly: 79.99 },
    features: [
      "Tout du plan Premium",
      "Jusqu'à 5 comptes",
      "Cercle d'aidants élargi",
      "Tableau de bord famille",
      "Rapports partagés",
      "Support dédié",
    ],
    cta: "Contacter l'équipe",
    ctaLink: "/contact?plan=family",
    popular: false,
    icon: Star,
  },
];

export function MooddayPricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="relative py-20 lg:py-32">
      {/* Background */}
      <div className="via-lavender/10 absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="bg-lavender/30 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Tarifs
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
            Choisissez le plan{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              qui vous convient
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Commencez gratuitement, évoluez selon vos besoins. Annulez à tout
            moment.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <span
            className={cn(
              "text-sm font-medium",
              !isYearly ? "text-gray-900 dark:text-gray-100" : "text-gray-500",
            )}
          >
            Mensuel
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={cn(
              "relative h-8 w-14 rounded-full transition-colors",
              isYearly ? "bg-primary" : "bg-gray-300 dark:bg-gray-600",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-6 rounded-full bg-white shadow transition-transform",
                isYearly ? "left-7" : "left-1",
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium",
              isYearly ? "text-gray-900 dark:text-gray-100" : "text-gray-500",
            )}
          >
            Annuel
            <span className="bg-sage/10 text-sage ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold">
              -33%
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PricingCard plan={plan} isYearly={isYearly} />
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Paiement sécurisé par Stripe. Annulation facile, sans engagement.
        </motion.p>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  isYearly,
}: {
  plan: (typeof plans)[0];
  isYearly: boolean;
}) {
  const price = isYearly ? plan.price.yearly : plan.price.monthly;
  const Icon = plan.icon;

  return (
    <div
      className={cn(
        "glass-card relative flex h-full flex-col rounded-3xl p-8",
        plan.popular ? "ring-primary shadow-lg ring-2" : "shadow-soft",
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg">
            Le plus populaire
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div
          className={cn(
            "mb-4 inline-flex size-12 items-center justify-center rounded-2xl",
            plan.popular
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          <Icon className="size-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {plan.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {price === 0 ? "Gratuit" : `${price}€`}
          </span>
          {price > 0 && (
            <span className="text-sm text-gray-500">
              /{isYearly ? "an" : "mois"}
            </span>
          )}
        </div>
        {isYearly && price > 0 && (
          <p className="text-sage mt-1 text-xs">
            Soit {(price / 12).toFixed(2)}€/mois
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              className={cn(
                "mt-0.5 size-5 shrink-0",
                plan.popular ? "text-primary" : "text-sage",
              )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaLink}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full gap-2 rounded-2xl",
          plan.popular
            ? "bg-primary hover:bg-primary/90"
            : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200",
        )}
      >
        {plan.cta}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

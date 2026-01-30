"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "../shared";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FaqBento() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Moodday est-il vraiment gratuit ?",
      answer:
        "Oui ! Le plan gratuit inclut le suivi d'humeur illimité, jusqu'à 3 médicaments et un historique de 30 jours. Aucune carte bancaire n'est requise.",
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer:
        "Absolument. Vos données sont chiffrées AES-256, hébergées en Union Européenne, et nous sommes conformes au RGPD. Nous ne vendons jamais vos données.",
    },
    {
      question: "Puis-je partager mes données avec mon médecin ?",
      answer:
        "Oui, via le cercle d'aidants (plan Pro). Vous pouvez inviter votre médecin, psychiatre ou proche de confiance à consulter vos rapports.",
    },
    {
      question: "L'application fonctionne-t-elle hors ligne ?",
      answer:
        "Oui, Moodday est une PWA. Vous pouvez enregistrer votre humeur même sans connexion. Les données se synchronisent automatiquement.",
    },
    {
      question: "Comment annuler mon abonnement ?",
      answer:
        "Vous pouvez annuler à tout moment depuis les paramètres de votre compte. Pas de frais cachés, pas de pénalités.",
    },
  ];

  return (
    <section className="bg-[#F8F7F3] py-24">
      <div className="mx-auto max-w-3xl px-6">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Questions fréquentes
            </h2>
            <p className="text-gray-600">
              Tout ce que vous devez savoir sur Moodday
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <ScrollReveal key={idx} delay={idx * 50}>
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all",
                  openIndex === idx
                    ? "border-[#2BA09F]/30 bg-white shadow-lg"
                    : "border-gray-100 bg-white hover:border-gray-200",
                )}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-gray-400 transition-transform",
                      openIndex === idx && "rotate-180 text-[#2BA09F]",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all",
                    openIndex === idx
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

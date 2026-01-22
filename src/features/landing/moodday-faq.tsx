"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    question: "Moodday remplace-t-il un suivi médical ?",
    answer:
      "Non, Moodday est un outil de suivi personnel qui complète votre prise en charge médicale. Il vous aide à mieux communiquer avec vos soignants en leur fournissant des données objectives sur votre parcours. En cas de crise, contactez toujours un professionnel de santé ou le 3114.",
  },
  {
    question: "Mes données sont-elles confidentielles ?",
    answer:
      "Absolument. Vos données sont chiffrées de bout en bout et stockées sur des serveurs sécurisés en Europe. Nous sommes conformes au RGPD et vous pouvez exporter ou supprimer vos données à tout moment. Nous ne vendons jamais vos données à des tiers.",
  },
  {
    question: "Puis-je partager mes données avec mon psychiatre ?",
    answer:
      "Oui, vous pouvez générer un rapport PDF complet de votre historique (humeur, médicaments, sommeil) à partager lors de vos consultations. Vous contrôlez exactement ce qui est inclus dans l'export.",
  },
  {
    question: "Comment fonctionne le cercle d'aidants ?",
    answer:
      "Vous pouvez inviter un proche de confiance à rejoindre votre cercle d'aidants. Vous décidez exactement ce qu'il peut voir (tendances générales, alertes en cas de baisse...). L'aidant ne voit jamais vos notes personnelles sans votre autorisation explicite.",
  },
  {
    question: "Y a-t-il des notifications ou des streaks ?",
    answer:
      "Nous avons volontairement éliminé toute forme de gamification culpabilisante. Pas de streak, pas de points, pas de notifications agressives. Vous recevez un rappel doux et configurable, et si vous manquez un jour, ce n'est pas grave. Votre bien-être passe avant les statistiques.",
  },
  {
    question: "Puis-je utiliser Moodday hors connexion ?",
    answer:
      "Oui, l'application fonctionne hors ligne pour la saisie quotidienne. Vos données se synchronisent automatiquement dès que vous retrouvez une connexion.",
  },
  {
    question: "Comment annuler mon abonnement ?",
    answer:
      "Vous pouvez annuler à tout moment depuis les paramètres de votre compte, sans frais ni justification. Vos données restent accessibles en lecture seule pendant 30 jours après l'annulation.",
  },
];

export function MooddayFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-20 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Questions fréquentes
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
            Vous avez des questions ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez des réponses aux questions les plus courantes sur Moodday.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <FaqItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Vous ne trouvez pas la réponse ?{" "}
          <Link
            href="/contact"
            className="text-primary font-semibold hover:underline"
          >
            Contactez-nous
          </Link>
        </motion.p>
      </div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="glass-card shadow-soft overflow-hidden rounded-2xl">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between p-6 text-left"
      >
        <span className="pr-4 font-semibold text-gray-900 dark:text-gray-100">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "text-primary size-5 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-gray-100 px-6 pt-4 pb-6 dark:border-gray-800">
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

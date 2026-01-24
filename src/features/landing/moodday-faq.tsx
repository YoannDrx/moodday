"use client";

import { useHydration } from "@/hooks/use-hydration";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

export function MooddayFaq() {
  const { t, tm } = useI18n();
  const isHydrated = useHydration();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs =
    tm<{ question: string; answer: string }[]>("moodday.faq.items") ?? [];

  return (
    <section className="relative py-20 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={isHydrated ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            {t("moodday.faq.badge")}
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
            {t("moodday.faq.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("moodday.faq.subtitle")}
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={isHydrated ? { opacity: 0, y: 10 } : false}
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
          initial={isHydrated ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {t("moodday.faq.contactPrompt")}{" "}
          <Link
            href="/contact"
            className="text-primary font-semibold hover:underline"
          >
            {t("moodday.faq.contactLink")}
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

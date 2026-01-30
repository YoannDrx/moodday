"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  HelpCircle,
  Lock,
  CreditCard,
  Smartphone,
  Users,
  Shield,
  Zap,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScrollReveal } from "../shared";

const faqIcons = [
  HelpCircle,
  Lock,
  CreditCard,
  Smartphone,
  Users,
  Shield,
  Zap,
  MessageCircle,
];

export function SectionFaq() {
  const { t, tm } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs =
    tm<{ question: string; answer: string }[]>("moodday.faq.items") ?? [];

  // Diviser les FAQs en deux colonnes
  const midpoint = Math.ceil(faqs.length / 2);
  const leftColumn = faqs.slice(0, midpoint);
  const rightColumn = faqs.slice(midpoint);

  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <ScrollReveal>
          <div className="mb-12 text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
              <HelpCircle className="size-8" />
            </div>
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("moodday.faq.title")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              {t("moodday.faq.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* FAQ Items - 2 columns on desktop */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {leftColumn.map((faq, index) => {
              const globalIndex = index;
              const Icon = faqIcons[globalIndex % faqIcons.length];
              return (
                <ScrollReveal
                  key={globalIndex}
                  delay={index * 50}
                  direction="up"
                >
                  <FaqItem
                    question={faq.question}
                    answer={faq.answer}
                    icon={Icon}
                    isOpen={openIndex === globalIndex}
                    onClick={() =>
                      setOpenIndex(
                        openIndex === globalIndex ? null : globalIndex,
                      )
                    }
                  />
                </ScrollReveal>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {rightColumn.map((faq, index) => {
              const globalIndex = midpoint + index;
              const Icon = faqIcons[globalIndex % faqIcons.length];
              return (
                <ScrollReveal
                  key={globalIndex}
                  delay={(index + midpoint) * 50}
                  direction="up"
                >
                  <FaqItem
                    question={faq.question}
                    answer={faq.answer}
                    icon={Icon}
                    isOpen={openIndex === globalIndex}
                    onClick={() =>
                      setOpenIndex(
                        openIndex === globalIndex ? null : globalIndex,
                      )
                    }
                  />
                </ScrollReveal>
              );
            })}
          </div>
        </div>

        {/* Contact CTA Card */}
        <ScrollReveal delay={300}>
          <div className="border-border bg-card mt-12 rounded-2xl border p-8 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
              <MessageCircle className="text-primary size-6" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-bold">
              {t("moodday.faq.contactPrompt")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Notre équipe répond sous 24h
            </p>
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-semibold transition-colors"
            >
              {t("moodday.faq.contactLink")}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  icon: Icon,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card overflow-hidden rounded-2xl border transition-all duration-300",
        isOpen
          ? "ring-primary/20 shadow-lg ring-2"
          : "hover:border-primary/30 hover:shadow-md",
      )}
    >
      <button
        onClick={onClick}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            isOpen
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </div>
        <span className="text-foreground flex-1 pr-2 font-semibold">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "text-primary size-5 shrink-0 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-border border-t px-5 pt-4 pb-5 pl-[4.5rem]">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

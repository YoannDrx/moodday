"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { completeLessonAction } from "../couple.action";

export function LessonQuiz({
  slug,
  question,
  options,
  answer,
  completed,
  nextHref,
}: {
  slug: string;
  question: string;
  options: string[];
  answer: number;
  completed: boolean;
  nextHref: string;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<number | null>(
    completed ? answer : null,
  );
  const [isPending, startTransition] = useTransition();
  const correct = picked === answer;

  const finish = () =>
    startTransition(async () => {
      const result = await completeLessonAction({ slug });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Leçon terminée. Bien joué !");
      router.push(nextHref);
      router.refresh();
    });

  return (
    <section
      className="sticker flex flex-col gap-4 p-6"
      aria-labelledby="quiz-title"
    >
      <h2 id="quiz-title" className="text-xl font-extrabold">
        Mini-quiz : {question}
      </h2>
      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-labelledby="quiz-title"
      >
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={picked === index}
            onClick={() => setPicked(index)}
            className={cn(
              "rounded-2xl border-2 border-[var(--ink)] px-4 py-3 text-left font-semibold",
              picked === index
                ? index === answer
                  ? "bg-mint text-[#2b1b30]"
                  : "bg-apricot-soft"
                : "bg-card hover:bg-accent",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p role="status" className="font-bold">
          {correct
            ? "Exactement."
            : "Pas tout à fait : relis la leçon, la bonne réponse y est."}
        </p>
      )}
      <Button
        variant="honey"
        size="lg"
        disabled={!correct || isPending}
        onClick={finish}
      >
        {completed ? "Leçon suivante" : "Terminer la leçon"}
      </Button>
    </section>
  );
}

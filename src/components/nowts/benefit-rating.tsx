"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type BenefitRatingProps = {
  value?: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export function BenefitRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: BenefitRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value ?? 0;
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={cn("flex gap-1", readonly ? "" : "cursor-pointer")}
      onMouseLeave={() => !readonly && setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          className={cn(
            "transition-transform",
            !readonly && "hover:scale-110 focus:outline-none",
            readonly && "cursor-default",
          )}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              star <= displayValue
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

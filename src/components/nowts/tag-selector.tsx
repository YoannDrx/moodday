"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

type TagSelectorProps = {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  getLabel?: (tag: string) => string;
  getColor?: (tag: string) => string;
  className?: string;
  maxSelections?: number;
  disabled?: boolean;
};

/**
 * TagSelector - Multi-select tag component
 *
 * Used for selecting context tags, side effects, etc.
 * Supports custom labels and colors via callback functions.
 */
export function TagSelector({
  tags,
  selectedTags,
  onTagToggle,
  getLabel,
  getColor,
  className,
  maxSelections,
  disabled = false,
}: TagSelectorProps) {
  const handleToggle = React.useCallback(
    (tag: string) => {
      if (disabled) return;

      const isSelected = selectedTags.includes(tag);

      // If trying to add and at max, don't allow
      if (
        !isSelected &&
        maxSelections &&
        selectedTags.length >= maxSelections
      ) {
        return;
      }

      onTagToggle(tag);
    },
    [disabled, selectedTags, maxSelections, onTagToggle],
  );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const label = getLabel ? getLabel(tag) : tag;
        const color = getColor ? getColor(tag) : undefined;

        return (
          <Badge
            key={tag}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all select-none",
              isSelected && color && `bg-${color}-500 hover:bg-${color}-600`,
              disabled && "cursor-not-allowed opacity-50",
              !disabled && "hover:scale-105 active:scale-95",
            )}
            style={
              isSelected && color
                ? { backgroundColor: color, borderColor: color }
                : undefined
            }
            onClick={() => handleToggle(tag)}
          >
            {isSelected && <Check className="mr-1 size-3" />}
            {label}
          </Badge>
        );
      })}
    </div>
  );
}

"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type MoodSliderProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Get color based on mood value (0-10)
 * Red (0) → Orange (3) → Yellow (5) → Light Green (7) → Green (10)
 */
function getMoodColor(value: number): string {
  if (value <= 2) return "rgb(239, 68, 68)"; // red-500
  if (value <= 4) return "rgb(249, 115, 22)"; // orange-500
  if (value <= 6) return "rgb(234, 179, 8)"; // yellow-500
  if (value <= 8) return "rgb(132, 204, 22)"; // lime-500
  return "rgb(34, 197, 94)"; // green-500
}

/**
 * Get emoji based on mood value
 */
function getMoodEmoji(value: number): string {
  if (value <= 1) return "😢";
  if (value <= 3) return "😔";
  if (value <= 5) return "😐";
  if (value <= 7) return "🙂";
  if (value <= 9) return "😊";
  return "😄";
}

/**
 * Trigger haptic feedback if available
 */
function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

/**
 * MoodSlider - A slider component for mood tracking (0-10)
 *
 * Features:
 * - Gradient colors based on mood value (red → green)
 * - Large touch target (48px) for accessibility
 * - Haptic feedback on mobile
 * - Emoji indicator
 * - Keyboard accessible (arrow keys)
 */
export function MoodSlider({
  value,
  onChange,
  className,
  disabled = false,
}: MoodSliderProps) {
  const { t } = useI18n();
  const color = getMoodColor(value);
  const emoji = getMoodEmoji(value);

  const handleValueChange = React.useCallback(
    (values: number[]) => {
      const newValue = values[0];
      if (newValue !== value) {
        triggerHaptic();
        onChange(newValue);
      }
    },
    [value, onChange],
  );

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Value display */}
      <div className="flex items-center justify-center gap-3">
        <span
          className="text-4xl"
          role="img"
          aria-label={t("mood.slider.emojiAria", { value })}
        >
          {emoji}
        </span>
        <span
          className="text-4xl font-bold tabular-nums"
          style={{ color }}
          aria-live="polite"
        >
          {value}
        </span>
      </div>

      {/* Slider */}
      <SliderPrimitive.Root
        value={[value]}
        onValueChange={handleValueChange}
        min={0}
        max={10}
        step={1}
        disabled={disabled}
        className={cn(
          "relative flex w-full touch-none items-center select-none",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <SliderPrimitive.Range
            className="absolute h-full transition-colors duration-150"
            style={{ backgroundColor: color }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block size-12 rounded-full border-4 shadow-lg transition-all",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:pointer-events-none",
            "hover:scale-110 active:scale-95",
          )}
          style={{
            backgroundColor: color,
            borderColor: "white",
            boxShadow: `0 4px 14px ${color}40`,
          }}
          aria-label={t("mood.slider.currentValueAria", { value })}
        />
      </SliderPrimitive.Root>

      {/* Scale labels */}
      <div className="text-muted-foreground flex justify-between px-1 text-xs">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
